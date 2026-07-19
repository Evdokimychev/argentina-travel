# Backup и restore rehearsal

## Текущее состояние

`npm run backup:schema` создаёт schema-only SQL в `var/backups/`. Это полезный локальный снимок перед миграцией, но не production backup: в нём нет данных, шифрования, внешнего хранения и доказательства восстановления. Файловая система Vercel не является долговечным хранилищем.

## Цели

| Данные | Целевой RPO | Целевой RTO | Владелец |
|---|---:|---:|---|
| Booking, capacity, payment audit, users | ≤1 час при доступном PITR; иначе ≤24 часа | ≤4 часа | `DATABASE_OWNER_TBD` |
| Контент, CMS, настройки и schema | ≤24 часа и перед каждой миграцией | ≤2 часа | `CMS_OWNER_TBD` |
| Email/notification operational state | ≤1 час | ≤4 часа | `OPS_OWNER_TBD` |
| Пользовательские медиа | ≤24 часа | ≤8 часов | `MEDIA_OWNER_TBD` |

Если тариф или инфраструктура не позволяют выполнить цель, фактический RPO/RTO фиксируется как риск, а не объявляется достигнутым.

## Требования к backup

- Полный backup данных и schema создаётся средствами Supabase/PITR либо `pg_dump` из доверенного runner, не из Vercel function.
- Копия шифруется до загрузки во внешнее хранилище с отдельным доступом.
- Для каждого артефакта сохраняются SHA-256, размер, время UTC, source project ref, release SHA, migration set, версия PostgreSQL и срок хранения.
- Минимальное хранение: 7 ежедневных, 4 еженедельных и 3 ежемесячных копии, если privacy policy не требует более короткого срока.
- Доступ — минимум привилегий; чтение и удаление журналируются.
- Backup не должен попадать в Git, `var/ops`, публичный bucket или логи CI.

## Безопасный restore rehearsal

Проводить ежемесячно и перед изменениями, затрагивающими критичные таблицы.

### 1. Preflight

1. Назначить `RESTORE_OPERATOR_TBD` и проверяющего `RESTORE_REVIEWER_TBD`.
2. Создать disposable staging Supabase project/database.
3. Вывести source/target project ref, URL host, release SHA и migration set без ключей.
4. Немедленно остановиться, если target ref совпадает с production или общим staging.
5. Отключить реальные письма, webhooks, partner writes, cron и платёжные production-ключи.

### 2. Restore

1. Скачать выбранную зашифрованную копию и проверить SHA-256 до расшифровки.
2. Зафиксировать `backup_created_at` и `restore_started_at`.
3. Восстановить schema и данные только в disposable target.
4. Применять forward migrations только после фиксации исходного migration set.
5. Сохранить stdout/stderr в закрытый artifact без connection strings и PII.

### 3. Проверки

- schema/migration version совпадает с ожидаемой;
- критичные таблицы существуют, row counts и контрольные агрегаты совпадают;
- RLS, grants, `SECURITY DEFINER` и storage policies проверены;
- tourist/organizer/admin не видят чужие данные;
- одна sandbox booking проходит без дубля и overbooking;
- cron/outbox отключены либо работают только с тестовыми адресами;
- медиа доступны из staging storage;
- `supabase:verify`, `rls-audit`, targeted tests и smoke зелёные.

### 4. Измерение

- Фактический RPO = `restore_started_at - backup_created_at`.
- Фактический RTO = время от решения о восстановлении до зелёного acceptance.
- Отчёт содержит длительность этапов, ошибки, ручные действия, достигнуты ли цели, владельца gap и срок.

### 5. Cleanup

1. Экспортировать только обезличенный manifest/evidence.
2. Удалить disposable project по отдельному подтверждению владельца.
3. Отозвать временные ключи и удалить локально расшифрованные копии.
4. Проверить отсутствие orphan storage и CI artifacts с данными.

## Forward-fix и rollback

- Для ошибочной миграции предпочтителен forward-fix новой миграцией.
- Откат deployment не откатывает schema автоматически.
- Restore production — крайняя мера с отдельным GO/NO-GO от `SERVICE_OWNER_TBD` и `DATABASE_OWNER_TBD`.
- До restore заморозить writes и зафиксировать хвост данных после backup, иначе возможна потеря новых booking/payment событий.

## Внешние блокеры

- `EXTERNAL_BLOCKER`: отдельный disposable Supabase staging target не предоставлен.
- `EXTERNAL_BLOCKER`: не подтверждены тариф/настройки managed backup или PITR.
- `EXTERNAL_BLOCKER`: внешнее зашифрованное хранилище, retention и audit доступа не настроены.
- `EXTERNAL_BLOCKER`: restore rehearsal нельзя считать выполненным без фактического восстановления и evidence.

