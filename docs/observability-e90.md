# E90 — Наблюдаемость: Sentry breadcrumbs и cron-alerts

Документ описывает слой наблюдаемости для ошибок и фоновых задач:

- breadcrumbs в Sentry для бронирований, платежей и cron;
- централизованный учёт результатов cron;
- API отчёта здоровья cron;
- предупреждение в админке при деградации;
- опциональные уведомления в Slack о сбоях cron.

## Что изменено

### 1) Sentry: контекст пользователя и breadcrumbs

Файл: `src/lib/monitoring/sentry.ts`

- Добавлены функции:
  - `setSentryUserContext(...)`
  - `addBookingBreadcrumb(...)`
  - `addPaymentBreadcrumb(...)`
  - `addCronBreadcrumb(...)`
- `captureException(...)` расширен контекстом (`tags`, `extra`) для удобного поиска инцидентов.
- Инициализация Sentry остаётся **безопасной для сборки без DSN**: при отсутствии `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` интеграция просто no-op.

Контекст пользователя из Supabase-сессии прокидывается в:

- `src/lib/admin/authorize-request.ts` (серверные админ-запросы);
- `src/context/AuthContext.tsx` (клиентская сессия).

### 2) Cron failure capture и единая обвязка

Файл: `src/lib/cron/log-cron-result.ts`

Добавлен wrapper:

- `logCronResult(route, result)`

Что делает wrapper:

1. Сохраняет результат в историю cron (`var/ops/cron-health-last.json` + in-memory ring buffer).
2. Пишет breadcrumb категории `cron`.
3. При `ok: false` отправляет исключение в Sentry.
4. Опционально отправляет уведомление в Slack, если задан `SLACK_OPS_WEBHOOK`.

### 3) История и health-агрегация cron

Файл: `src/lib/ops/ops-status.ts`

Добавлены:

- `CronRouteRunEntry` и `CronHealthReport`;
- `appendCronRouteRun(...)`;
- `readCronHealthReport(...)`.

Источник данных:

- приоритетно `var/ops/cron-health-last.json`;
- fallback на in-memory ring buffer (для окружений с ограниченной ФС).

### 4) Новый API отчёта

Маршрут: `GET /api/cron/ops/health-report`

Файл: `src/app/api/cron/ops/health-report/route.ts`

Возвращает агрегированный статус:

- `ok` / `status` (`ok` | `degraded`)
- `failingRoutes`
- `latestByRoute`
- `recent`
- `source` (`file` | `memory` | `none`)

Авторизация:

- либо cron-токен (`authorizeCronRequest`);
- либо admin session (`authorizeAdminRequest`).

### 5) Admin alert banner при деградации

Файлы:

- `src/components/admin/AdminCronHealthBanner.tsx`
- `src/components/admin/AdminSidebar.tsx`

В `AdminPageShell` добавлен баннер, который:

- запрашивает `/api/cron/ops/health-report`;
- отображается только при `status: degraded`;
- показывает последний упавший маршрут и ссылку на раздел эксплуатации.

### 6) Интеграция wrapper в cron-маршруты

`logCronResult(...)` подключён в:

- `/api/cron/affiliate-sync`
- `/api/cron/platform-maintenance`
- `/api/cron/tripster-sync`
- `/api/cron/sputnik8-sync`
- `/api/cron/notifications/digest`
- `/api/cron/messaging/cleanup-typing`
- `/api/cron/content-freshness`
- `/api/cron/ops/backup-hint`

## Переменные окружения

В `.env.example` добавлено:

```env
SLACK_OPS_WEBHOOK=
```

Если переменная не задана, Slack-уведомления не отправляются, обработка cron продолжается.

## Формат Slack-оповещения

Сообщение содержит:

- маршрут cron;
- время запуска;
- текст ошибки;
- (опционально) `details` в компактном виде.

## Ожидаемое поведение

1. Упавший cron фиксируется в `cron-health-last.json` и (если доступно) в ring buffer.
2. `GET /api/cron/ops/health-report` отдаёт `503` и `status: "degraded"`.
3. В админке появляется предупреждающий баннер.
4. В Sentry появляется exception с тегами `area=cron` и `route=...`.
5. При наличии `SLACK_OPS_WEBHOOK` уходит alert в Slack.
