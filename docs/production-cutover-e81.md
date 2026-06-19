# E81 — Исполнительный чеклист production cutover

Документ для фактического окна релиза: что проверять перед переключением, в каком порядке запускать миграции и smoke-проверки, и как откатываться без потери контроля.

Базовый runbook: [production-cutover-e72.md](./production-cutover-e72.md). Этот документ не заменяет E72, а фиксирует краткую «боевую» последовательность действий.

## 1) Подготовка за 1-2 часа до cutover

### 1.1 Проверка переменных окружения (только имена, без значений)

- [ ] `DEPLOY_ENV=production`
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `DATABASE_URL`
- [ ] `CRON_SECRET`
- [ ] `RESEND_API_KEY` (если используется email-рассылка)
- [ ] `SENTRY_DSN` и `NEXT_PUBLIC_SENTRY_DSN` (рекомендуется)
- [ ] `NEXT_PUBLIC_ENABLE_DEMO_SEED=false`

Проверка CLI:

```bash
npm run production-readiness
```

Критерий: в отчёте нет `fail`.

### 1.2 Контроль артефактов перед релизом

- [ ] На staging уже прогнан тот же commit SHA
- [ ] `GET /api/health` на staging возвращает корректный `migrationVersion`
- [ ] В админке (`/admin/settings`) панель готовности без блокеров
- [ ] Есть актуальная резервная копия схемы (`npm run backup:schema`) и копия сохранена вне репозитория
- [ ] E100 smoke: `PLAYWRIGHT_BASE_URL=<staging-url> npm run test:e2e:smoke` проходит без падений
- [ ] Подготовлен API-ключ `tours:read` для post-deploy load-прогона `/api/v1/tours`

## 2) Порядок выполнения в релизном окне

### Шаг 1. Зафиксировать исходное состояние

1. Записать текущий production deployment в Vercel (ID/время).
2. Зафиксировать текущий `migrationVersion` с production:

```bash
curl -fsS https://www.goargentina.ru/api/health
```

### Шаг 2. Применить миграции production

Миграции применяются в лексикографическом порядке файлов `supabase/migrations/*.sql`.

1. Убедиться, что `DATABASE_URL` указывает на production.
2. Выполнить:

```bash
npm run supabase:migrate
```

3. Проверить, что `GET /api/health` отдаёт новый `migrationVersion`.

### Шаг 3. Выполнить деплой production

1. Выполнить деплой проверенного commit SHA.
2. Убедиться, что в окружении production заданы корректные значения из чеклиста.

### Шаг 4. Проверить cron-оркестраторы (Vercel ограничение: 2 cron)

По `vercel.json` должны быть активны:

- [ ] `/api/cron/affiliate-sync`
- [ ] `/api/cron/platform-maintenance`

При ручной проверке используйте авторизацию `Authorization: Bearer <CRON_SECRET>`.

## 3) Smoke после деплоя (обязательно)

Автоматический smoke:

```bash
SMOKE_BASE_URL=https://www.goargentina.ru npm run production-smoke
PLAYWRIGHT_BASE_URL=https://www.goargentina.ru npm run test:e2e:smoke
```

Проверяемые URL:

- [ ] `GET /api/health`
- [ ] `GET /`
- [ ] `GET /tours`
- [ ] `GET /excursions`
- [ ] `GET /destinations`
- [ ] `GET /places`
- [ ] `GET /blog`

Дополнительно:

- [ ] В админке открыть `/admin/settings` и проверить панель «Чеклист cutover»
- [ ] Убедиться, что общий статус панели не красный
- [ ] Выполнить короткий load scaffold `/api/v1/tours`:

```bash
LOAD_BASE_URL=https://www.goargentina.ru \
LOAD_PUBLIC_API_KEY=<public_api_key> \
LOAD_DURATION_SEC=30 \
LOAD_RPS=5 \
node scripts/load-test-public-api.mjs
```

## 4) Критерии успешного завершения cutover

- [ ] `production-smoke` завершился без ошибок
- [ ] `test:e2e:smoke` завершился без ошибок
- [ ] `GET /api/health` возвращает `ok: true` или контролируемый `ok: false` без критичных ошибок БД
- [ ] `environment.deployEnv` в `/api/health` равен `production`
- [ ] `migrationVersion` совпадает с ожидаемой последней миграцией
- [ ] Нет блокеров в админских панелях готовности
- [ ] Load scaffold `/api/v1/tours` не показывает системных 5xx/сетевых ошибок

## 5) План отката (rollback)

### Уровень A — быстрый откат приложения

Использовать, если проблема в коде, а схема БД совместима:

1. Vercel: Promote предыдущий стабильный deployment.
2. Проверить:
   - `GET /api/health`
   - `npm run production-smoke` на production URL.

### Уровень B — откат схемы БД

Использовать, если проблема в миграциях или несовместимости схемы:

1. Включить maintenance-режим.
2. Восстановить схему из последнего резервного дампа.
3. Откатить приложение на совместимую версию.
4. Повторить smoke и health-проверки.

### Уровень C — аварийная стабилизация

Если production Supabase временно недоступен:

1. Ограничить трафик (maintenance/частичное отключение функций).
2. Зафиксировать инцидент и временную конфигурацию.
3. После восстановления вернуть production-ключи и повторить smoke.

## 6) Команды для релизного окна (кратко)

```bash
# 1) Предварительная проверка
npm run production-readiness

# 2) Миграции production
npm run supabase:migrate

# 3) Post-deploy smoke
SMOKE_BASE_URL=https://www.goargentina.ru npm run production-smoke
PLAYWRIGHT_BASE_URL=https://www.goargentina.ru npm run test:e2e:smoke

# 4) Public API load scaffold
LOAD_BASE_URL=https://www.goargentina.ru \
LOAD_PUBLIC_API_KEY=<public_api_key> \
node scripts/load-test-public-api.mjs
```
