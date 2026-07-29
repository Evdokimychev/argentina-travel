# Backup и безопасная проверка восстановления

## Что важно владельцу сайта сейчас

- Production-проект Supabase сейчас находится на тарифе **Free**.
- Наличие доступного managed backup и Point-in-Time Recovery (PITR) для этого проекта **не подтверждено**. PITR нельзя считать включённым, пока это явно не показано в Supabase Dashboard.
- На Free-проекте backup нельзя считать доступным для скачивания только потому, что Supabase делает внутренние daily backups. Это отдельный внешний риск.
- Автоматизация ниже подготовлена в коде, но GitHub secrets, offline-ключ `age` и приватное хранилище ещё должен настроить владелец.
- Фактический restore rehearsal **не проведён**. Наличие backup-файла не доказывает, что восстановление работает.

Официальные ограничения нужно перепроверять перед изменением тарифа: [Supabase Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod), [Backups](https://supabase.com/docs/guides/platform/backups), [PITR usage](https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery).

## Что уже подготовлено

Диагностический `npm run backup:schema` не заменяет backup данных. Перед
`pg_dump` он требует `DATABASE_URL` и независимый trusted ref из
`SUPABASE_PROJECT_REF`/`NEXT_PUBLIC_SUPABASE_URL`, строго сверяет direct/pooler
target и передаёт credentials только через `PG*` process environment. Unknown
или mismatched target останавливается до запуска dump; URL не попадает в argv.

Workflow `.github/workflows/supabase-logical-backup.yml` ежедневно в 03:30 по Буэнос-Айресу:

1. Останавливается, если нет строки подключения, project ref или публичного получателя `age`.
2. Делает `pg_dump` в custom format со **schema и данными** всей логической базы. Флаги `--schema-only` и `--data-only` не используются.
3. Проверяет каталог dump через `pg_restore --list`.
4. Собирает только безопасное evidence: список schema, названия таблиц, количества строк и флаги RLS. Строки таблиц, email, телефоны и connection string в manifest не попадают.
5. Вычисляет SHA-256 исходного dump.
6. Шифрует dump с помощью `age` **до загрузки**.
7. Вычисляет SHA-256 зашифрованного файла и загружает только `.age` и JSON manifest.
8. Удаляет незашифрованный временный dump даже при ошибке.

Retention назначается автоматически:

| Копия | Когда | Хранение |
|---|---|---:|
| Daily | обычный день | 8 дней |
| Weekly | воскресенье UTC | 35 дней |
| Monthly | первое число месяца UTC | 90 дней |

Это даёт минимум 7 ежедневных, 4 еженедельных и 3 месячных поколений в пределах возможностей GitHub Artifacts. Если privacy policy потребует более короткий срок, retention нужно уменьшить.

## Однократная настройка владельцем

В GitHub создайте environment `production-backup` и добавьте:

| Имя | Где | Что указать |
|---|---|---|
| `BACKUP_DATABASE_URL` | Secret | Direct или Session Pooler PostgreSQL URL на порту 5432. Transaction pooler 6543 запрещён. |
| `BACKUP_AGE_RECIPIENT` | Secret | Только публичный X25519 recipient вида `age1...`. |
| `BACKUP_SOURCE_PROJECT_REF` | Variable | Production Supabase project ref. |

Закрытый `AGE-SECRET-KEY-...`:

- никогда не добавлять в GitHub, Vercel, `.env` проекта или manifest;
- сохранить минимум в двух контролируемых offline-местах;
- доступ к нему должен быть у владельца восстановления и резервного ответственного;
- один раз проверить, что выбранный recipient действительно соответствует offline identity.

После настройки вручную запустите workflow и проверьте:

- workflow завершился успешно;
- artifact содержит ровно один `.dump.age` и один `.manifest.json`;
- в manifest стоят `includesSchema: true`, `includesData: true`, два SHA-256 и `restoreRehearsal.status: not_run`;
- незашифрованного `.dump` в artifact нет;
- доступ и скачивание artifact видят только уполномоченные участники GitHub.

## Restore rehearsal — только disposable target

Никогда не запускайте эти шаги на production или общем staging. Скрипт содержит жёсткий запрет для production ref `uooxrypocahomoqzdvzy`, дополнительно сравнивает target с `PRODUCTION_SUPABASE_PROJECT_REF`, source ref из manifest, hostname и PostgreSQL username.

### 1. Подготовить безопасную среду

1. Создать отдельную disposable Supabase database/project совместимой версии. Код этого не делает и платный проект не создаёт.
2. Не добавлять в disposable среду реальные Resend, webhook, partner, payment и cron credentials.
3. Скачать `.dump.age` и `.manifest.json` в закрытую временную папку.
4. Указать переменные только в локальной сессии оператора:

```bash
export BACKUP_MANIFEST_PATH="/private/path/database.manifest.json"
export BACKUP_ENCRYPTED_PATH="/private/path/database.dump.age"
export RESTORE_TARGET_DATABASE_URL="postgresql://...disposable-target..."
export RESTORE_TARGET_PROJECT_REF="abcdefghijklmnopqrst"
export PRODUCTION_SUPABASE_PROJECT_REF="uooxrypocahomoqzdvzy"
export RESTORE_DISPOSABLE_CONFIRMATION="YES_DISPOSABLE_TARGET_ONLY"
export RESTORE_EXTERNAL_WRITES_DISABLED="true"
npm run backup:restore:preflight
```

Preflight проверяет SHA-256 encrypted artifact и безопасность target, но ничего не восстанавливает.

### 2. Расшифровать и восстановить вручную

Работать только в закрытой временной папке. Команды не должны попадать в общий CI log.

```bash
age --decrypt --identity "/offline/path/backup-identity.txt" \
  --output "/private/tmp/database.dump" \
  "$BACKUP_ENCRYPTED_PATH"

pg_restore \
  --exit-on-error \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname "$RESTORE_TARGET_DATABASE_URL" \
  "/private/tmp/database.dump"
```

Полный logical dump включает Supabase-managed schema. Восстановление допустимо только в совместимый disposable Supabase target; конфликты extensions/managed objects нельзя молча игнорировать. Если официальный способ восстановления Supabase изменился, сначала обновить runbook по актуальной документации.

### 3. Проверить восстановленную базу

```bash
npm run backup:restore:verify
```

Verification подключается read-only и сравнивает:

- наличие `public`, `auth`, `storage` schema;
- все зафиксированные таблицы;
- точные row counts без чтения самих строк в отчёт;
- флаги RLS и `FORCE RLS` для каждой таблицы.

Evidence сохраняется в `var/restore-rehearsal/` и не коммитится. Любое отсутствие таблицы, несовпадение count или RLS завершает проверку ошибкой.

Дополнительно вручную проверить sandbox-сценарии туриста, организатора и администратора, запрет чужих данных, бронирование без overbooking и отсутствие реальных email/webhook/payment вызовов.

### 4. Cleanup

1. Сохранить только manifest и обезличенный verification evidence.
2. Безвозвратно удалить расшифрованный dump.
3. Удалить disposable target только после отдельного подтверждения владельца.
4. Отозвать временные credentials.
5. Зафиксировать RPO, RTO, ошибки, ручные действия и владельца каждого gap.

## Чего этот пакет пока не доказывает

- Managed Supabase backup или PITR не подтверждены и не включались этим изменением.
- GitHub environment/secrets и доступ к artifacts не настроены кодом.
- Offline age identity не создана и не проверена кодом.
- Внешнее независимое storage с отдельным audit доступа не подключено.
- Restore rehearsal не считается выполненным до реального disposable restore и зелёного verification evidence.

Production restore остаётся отдельным аварийным решением с GO/NO-GO владельца сервиса и базы. Откат deployment не откатывает schema и данные автоматически.
