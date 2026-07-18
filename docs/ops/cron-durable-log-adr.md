# ADR: долговечный журнал cron

Статус: **implementation blocked — schema canonicalization required**  
Дата: 2026-07-16

## Решение

Источником operational truth для каждого запуска cron должна стать отдельная service-role-only таблица `public.ops_cron_runs`. Файл `var/ops/cron-health-last.json` и память процесса остаются только локальным диагностическим fallback и не могут подтверждать production health.

Миграция намеренно не создана в текущем shared tree. До канонизации истории это небезопасно: каталог содержит повторяющиеся migration timestamp, remote `schema_migrations` недоступна, clean replay и явные grants всего набора не доказаны, отдельного staging нет.

## Предлагаемый контракт

Поля:

| Поле | Тип | Назначение |
|---|---|---|
| `id` | `uuid` | Идентификатор записи |
| `run_id` | `uuid` | Один запуск/попытка; idempotency для повторной записи |
| `route` | `text` | Канонический cron route |
| `status` | `text` | `started`, `succeeded`, `failed`, `timed_out` |
| `started_at` | `timestamptz` | Время старта |
| `finished_at` | `timestamptz null` | Время завершения |
| `duration_ms` | `integer null` | Длительность |
| `status_code` | `integer null` | HTTP status |
| `message` | `text` | Безопасное краткое сообщение без PII |
| `details` | `jsonb` | Ограниченные агрегаты, без payload пользователей |
| `release_sha` | `text null` | Release evidence |
| `environment` | `text` | `production`, `preview`, `staging` |
| `created_at` | `timestamptz` | Retention/order |

Ограничения и индексы:

- unique `(environment, run_id)`;
- check для допустимых `status`;
- index `(environment, route, started_at desc)`;
- partial index незавершённых `status = 'started'`;
- index `created_at` для retention;
- `details` ограничивается приложением по размеру и allowlist полей.

## Безопасность

- RLS включён.
- `anon` и `authenticated`: `revoke all`.
- `service_role`: только необходимые `select`, `insert`, `update`, `delete`.
- Нет permissive policy `to public`.
- Клиентский браузер никогда не пишет журнал напрямую.
- Admin API читает только агрегаты и безопасные сообщения; stack traces и connection strings наружу не возвращаются.

## Runtime-поведение

После применения канонической миграции:

1. Общий wrapper создаёт `started` до бизнес-операции.
2. Тот же `run_id` атомарно переводится в `succeeded`/`failed`.
3. Ошибка journal insert/update не скрывает результат cron, но создаёт отдельный Sentry/Slack alert `cron_observability_write_failed`.
4. Health считает `missed`, если нет успешного/failed завершения после schedule + grace period.
5. `started` старше route timeout считается `timed_out`/stale.
6. Sentry Vercel Cron Monitors остаются независимым внешним каналом, но не заменяют DB history.

## Retention

- детальные успешные записи: 30 дней;
- failed/timed_out: 90 дней;
- после retention остаются суточные агрегаты для SLO, если они не содержат PII;
- cleanup выполняется отдельной ограниченной batch-операцией и сам журналируется.

## Условия разблокировки

Перед созданием migration-файла обязательны все пункты:

1. Назначен единственный владелец migration sequence.
2. Повторяющиеся timestamps разрешены каноническим планом без переименования уже применённых production-миграций вслепую.
3. Доступна достоверная remote migration history или создан подписанный baseline manifest.
4. Полный набор миграций воспроизводится на чистой disposable базе.
5. Явные grants/RLS проверены на актуальном поведении Supabase Data API.
6. Есть отдельный staging для apply, fault injection, missed/stale run и retention проверки.
7. Generated DB types обновляются одним владельцем после freeze схемы.

## Acceptance после разблокировки

- каждый маршрут из `vercel.json` создаёт durable run;
- повтор одного `run_id` не создаёт дубль;
- anon/authenticated не читают и не пишут таблицу;
- failed, missed и stale вызывают alert;
- admin видит `last run`, duration, release SHA и безопасную причину;
- retention удаляет только записи старше установленного окна;
- production не объявляется зелёным при отсутствии durable данных.

