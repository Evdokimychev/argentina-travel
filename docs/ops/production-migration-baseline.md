# Production migration baseline

Статус: **канонический app-journal применён и проверен**

Проект: `uooxrypocahomoqzdvzy`

Baseline: `production-2026-07-19-v1`

## Зачем он нужен

Production-схема появилась раньше единого журнала миграций. Повторное исполнение всего каталога поверх живой базы небезопасно. Поэтому проект использует собственный закрытый журнал `app_migrations.schema_migrations` с SHA-256 каждого SQL-файла и отдельной записью доказанного baseline.

Baseline manifest хранится в `supabase/baselines/production-2026-07-19-v1.json`. Он связывает:

- канонический Supabase project ref;
- 102 файла миграций, их последний id и общий checksum;
- PostgreSQL version;
- fingerprint 3 634 объектов public-схемы: таблиц, колонок, constraints, индексов, RLS policies, функций, триггеров и явных grants;
- зашифрованные backups и релизный аудит, на основании которых baseline принят.

## Безопасные команды

```bash
# Только read-only: снять текущий fingerprint production
npm run supabase:baseline:inspect

# Только read-only: сравнить production с закоммиченным manifest
npm run supabase:baseline:verify

# Канонический способ применить новые pending migrations
npm run supabase:migrate
```

`supabase db push` для этого production-проекта запрещён: стандартный `supabase_migrations` не является каноническим источником истории. Проектный runner дополнительно проверяет target, checksum всех уже применённых файлов и отказывается от blind replay.

## Одноразовое применение baseline

Команда выполняет одну транзакцию, берёт advisory lock и ничего не записывает при несовпадении project ref, schema fingerprint, количества объектов или migration checksum.

```bash
MIGRATION_TARGET_ENVIRONMENT=production \
MIGRATION_BASELINE_CONFIRMATION=PRODUCTION_SCHEMA_FINGERPRINT_VERIFIED \
npm run supabase:baseline:apply
```

Повторный запуск идемпотентен: он допускается только когда все 102 строки уже полностью совпадают. Частичный или изменённый journal приводит к fail-closed остановке.

19 июля 2026 года baseline записан в production одной транзакцией. Повторный apply подтвердил идемпотентность, а read-only verify — 102 совпадающие checksum-строки и отсутствие pending-миграций.

## Правила будущих миграций

1. Создать файл только через `supabase migration new <name>`.
2. Не изменять SQL уже применённой миграции — checksum drift блокирует runner.
3. Прогнать миграцию на local/disposable target и выполнить профильные SQL-тесты.
4. Для production сначала сделать backup и проверить read-only baseline.
5. Применять только `npm run supabase:migrate` с явным target/confirmation.
6. После apply проверить journal, RLS, grants, generated types, health и rollback-план.

Отдельная restore rehearsal всё ещё требует disposable Supabase target. Baseline устраняет риск повторного replay, но не заменяет восстановление backup.
