# Runbook реагирования на инциденты

## Владельцы и каналы

| Роль | Владелец |
|---|---|
| Incident commander | `INCIDENT_COMMANDER_TBD` |
| Technical lead | `TECH_LEAD_TBD` |
| Support/comms | `SUPPORT_OWNER_TBD` |
| Supabase owner | `SUPABASE_OWNER_TBD` |
| Vercel owner | `VERCEL_OWNER_TBD` |
| Partner/payment owner | `PARTNER_OWNER_TBD` |

- Основной канал: `INCIDENT_CHANNEL_TBD`.
- Резервный канал: `INCIDENT_FALLBACK_CHANNEL_TBD`.
- Страница статуса/шаблон сообщения: `STATUS_PAGE_TBD`.
- Никогда не помещать в сообщения токены, DSN, email, телефоны, платёжные данные и полные тела webhook.

## Классификация

| Уровень | Примеры | Подтверждение | Обновления |
|---|---|---:|---:|
| SEV-1 | Сайт или booking недоступны; потеря/утечка данных; ошибочные списания; массовые дубли | ≤10 минут | каждые 30 минут |
| SEV-2 | Частичная деградация; один партнёр; cron/email backlog; админка недоступна | ≤30 минут | каждый час |
| SEV-3 | Единичная ошибка без широкого влияния | следующий рабочий день | по существенным изменениям |

Любое подозрение на утечку данных или компрометацию ключа сразу считается SEV-1.

## Первые 15 минут

1. Создать запись инцидента: время UTC, уровень, затронутые роли и первый симптом.
2. Назначить incident commander; один человек координирует, остальные диагностируют.
3. Зафиксировать release SHA, deployment URL, environment и Supabase project ref без секретов.
4. Проверить `/api/health`, Vercel runtime logs, Sentry и последние cron/outbox показатели.
5. Определить влияние отдельно для туриста, организатора, администратора, booking, оплаты и партнёрских переходов.
6. Остановить опасный write-path feature flag или откатить deployment, если это уменьшает ущерб.
7. Не запускать массовый retry, restore, миграцию или очистку без списка затрагиваемых записей и владельца операции.

## Диагностические ветки

### Сайт или база

1. Сравнить required checks Supabase REST и direct Postgres; optional search не должен маскировать обязательный отказ.
2. Проверить Vercel deployment status и ошибки функций.
3. Проверить Supabase status, connection pool, egress и размер БД.
4. При отказе только поиска оставить Postgres/static fallback и объявить деградацию.
5. При отказе записи в БД закрыть booking/payment write paths до подтверждения консистентности.

### Бронирование

1. Посчитать `5xx`, конфликты, idempotency replays и возможные дубли по одному временному интервалу.
2. Проверить availability/capacity до и после каждого спорного заказа.
3. Не исправлять статус вручную до сверки туристического, организаторского и административного представления.
4. После восстановления повторить один sandbox/staging journey UI → API → DB → три кабинета.

### Partner redirect

1. Разделить provider error, локальный mapping error и intentional fallback.
2. Проверить allowlist домена, attribution и итоговый URL без создания реального заказа.
3. Отключить только проблемного провайдера; не обещать пользователю внутреннее бронирование при внешнем handoff.

### Cron и email

1. Проверить последний durable run, длительность, missed/stale и конкретную subtask.
2. Для outbox снять counts pending/failed/dead/stale и возраст старейшей записи.
3. Перед retry определить идемпотентность и размер партии; сначала staging или одна запись.
4. Не отправлять тестовые письма реальным пользователям.

### Платежи

1. Остановить новый checkout, если webhook или reconciliation недостоверны.
2. Сверить provider event ID, подпись, idempotency key и неизменяемый audit trail.
3. Не отмечать оплату успешной по данным браузерного redirect.
4. Refund/replay выполнять только в sandbox до отдельного production-разрешения.

## Восстановление и закрытие

Инцидент можно закрыть, когда:

- SLI стабилен минимум 30 минут для SEV-1 и 60 минут для SEV-2;
- backlog обработан или имеет безопасный план и владельца;
- нет дублей, overbooking, ошибочных платежей и orphan records;
- проверены туристический, организаторский и административный сценарии;
- зафиксированы SHA, причина, временная мера и окончательное исправление.

Postmortem для SEV-1/SEV-2 создаётся не позднее 2 рабочих дней. Он содержит timeline, impact, root cause, detection gap, что сработало, corrective actions с владельцами и сроками. Формулировки не должны обвинять людей.

## Внешние блокеры

- `EXTERNAL_BLOCKER`: не назначены on-call, incident commander и канал оповещения.
- `EXTERNAL_BLOCKER`: production Sentry и Vercel alert routing требуют доступа к внешним кабинетам.
- `EXTERNAL_BLOCKER`: внешний status/uptime сервис не настроен.
- `EXTERNAL_BLOCKER`: операции restore, payment и массового retry требуют отдельного staging и явного разрешения владельца.



## GoArgentina P0 health probes (2026-07-24)

Проверять при SEV-1/2 по каталогу, 404 турам или Supabase:

```bash
curl -sS https://www.goargentina.ru/api/health/public
curl -sS https://www.goargentina.ru/api/health/database
curl -sS https://www.goargentina.ru/api/health/partners
SMOKE_BASE_URL=https://www.goargentina.ru npm run crawl:public-tour-details
SMOKE_BASE_URL=https://www.goargentina.ru npm run release:public-production
```

| Сигнал | Действие |
|--------|----------|
| `status=degraded` + `postgresDirect.ok` + REST 402 egress | Human-gate billing/spend cap Supabase; код уже отдаёт unavailable/503, не 404 |
| `status=down` на database/partners | SEV-1; остановить sync cron retries; проверить PG/pooler |
| Всплеск `/tours/*` 404 при живом каталоге | Проверить, что self-HEAD middleware не вернулся; сверить existence three-state |
| Sync run success с 0 upsert | Считать failed; не публиковать пустой snapshot |
| Analytics readiness fail только по env | Не блокирует R1; блокирует платный трафик (R3) |

Alerting/pager routing: EXTERNAL_BLOCKER до назначения owners выше.
