# E72 — Supabase production cutover playbook

Пошаговый runbook перехода с **staging** на **production** Supabase-проекта для «Пора в Аргентину». Используйте вместе с [DEPLOY.md](./DEPLOY.md).

## Принципы

1. **Отдельные проекты Supabase** для staging и production — никогда не тестируйте миграции сразу на боевой БД.
2. **Сначала staging, потом production** — один и тот же commit SHA и набор миграций.
3. **Без демо-данных** — `NEXT_PUBLIC_ENABLE_DEMO_SEED=false` на обоих окружениях.
4. **Явная метка окружения** — `DEPLOY_ENV=staging|production` на каждом хосте.
5. **Откат** — через резервную копию схемы и откат деплоя приложения, не через «ручное удаление таблиц».

---

## Матрица переменных окружения

| Переменная | Local dev | Staging | Production | Примечание |
|------------|-----------|---------|------------|------------|
| `DEPLOY_ENV` | — или `staging` | `staging` | `production` | Отображается в `/api/health` и админке |
| `NODE_ENV` | `development` | `production` | `production` | Next.js |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | staging origin | `https://www.goargentina.ru` | Canonical URL |
| `NEXT_PUBLIC_SUPABASE_URL` | dev/staging project | **staging** project | **production** project | Разные проекты |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | staging anon | staging anon | production anon | Публичный, RLS обязателен |
| `SUPABASE_SERVICE_ROLE_KEY` | staging service | staging service | production service | Только сервер |
| `DATABASE_URL` | staging direct/pooler | staging | production | Для `npm run supabase:migrate` |
| `NEXT_PUBLIC_ENABLE_DEMO_SEED` | `true` допустимо | `false` | `false` | Блокер readiness |
| `CRON_SECRET` | локальный | уникальный staging | уникальный production | Bearer для `/api/cron/*` |
| `GIT_SHA` | — | commit SHA | commit SHA | CI/Vercel |
| `SENTRY_DSN` | — | рекомендуется | рекомендуется | Мониторинг ошибок |
| `MERCADOPAGO_*` | sandbox | sandbox | production tokens | Отдельные ключи |
| `STRIPE_*` | test mode | test mode | live mode | Отдельные ключи |
| `STAGING_*` | в `.env.local` | маппинг в Vercel | не используется | См. [DEPLOY.md](./DEPLOY.md) |

На Vercel для **preview/staging** подставьте значения `STAGING_*` в production-имена (`NEXT_PUBLIC_SUPABASE_URL` и т.д.) для соответствующего environment.

---

## Чек-лист: staging → production

### Фаза A — Подготовка (до cutover)

- [ ] Все PR влиты в `main`, CI зелёный (`tsc`, lint, `rls-audit`)
- [ ] На staging применены все миграции: `DATABASE_URL=$STAGING_DATABASE_URL npm run supabase:migrate`
- [ ] `npm run production-readiness` на staging (с `DEPLOY_ENV=staging`) — без `fail`
- [ ] `npm run rls-audit` — `var/ops/rls-audit-last.json` с `ok: true`
- [ ] `npm run backup:schema` на **production** (если уже есть данные) или на staging перед финальной репетицией
- [ ] Резервная копия вне репозитория (S3, локальный архив)
- [ ] Платёжные ключи production проверены в dashboard Mercado Pago / Stripe (webhook URLs)
- [ ] `CRON_SECRET`, `RESEND_API_KEY`, партнёрские API — production-значения в Vercel **Production** environment

### Фаза B — Репетиция на staging

- [ ] Деплой того же commit SHA, что пойдёт в production
- [ ] `GET /api/health` — `ok: true`, `environment.deployEnv: "staging"`, `migrationVersion` совпадает с последним файлом в `supabase/migrations/`
- [ ] `node scripts/smoke-public.mjs` с `SMOKE_BASE_URL=<staging>`
- [ ] `npm run supabase:verify` (newsletter + contact → 200)
- [ ] Ручной smoke: вход туриста, бронирование, сообщения, оплата (sandbox)
- [ ] Админка → **Настройки** → панель «Готовность к production» без блокеров

### Фаза C — Cutover production

1. **Maintenance** (опционально): включить `maintenanceMode` в админке или maintenance page на CDN.
2. **Миграции production:**
   ```bash
   # Локально с production DATABASE_URL (Session pooler при IPv6)
   DATABASE_URL="<production-pooler-url>" npm run supabase:migrate
   ```
3. **Переменные Vercel Production** — сверить с матрицей выше; `DEPLOY_ENV=production`.
4. **Деплой** commit SHA из staging-репетиции.
5. **Проверки сразу после деплоя** (см. раздел Smoke tests).
6. Снять maintenance.

### Фаза D — После cutover (24–48 ч)

- [ ] Мониторинг Sentry, Vercel Analytics
- [ ] Cron jobs: tripster/sputnik8 sync, digest (см. `vercel.json`)
- [ ] Webhook платежей: тестовая транзакция в live/sandbox по политике запуска
- [ ] Админка → журнал действий, очередь модерации

---

## Порядок миграций

Миграции применяются **в лексикографическом порядке** имён файлов в `supabase/migrations/`:

```bash
ls supabase/migrations/*.sql | sort
```

Текущая последняя версия в коде: поле `migrationVersion` в `GET /api/health` (источник: `src/lib/ops/migrations-version.ts`).

| Этап | Диапазон (пример) | Содержание |
|------|-------------------|------------|
| Phase 0 | `20250611000000` | Lead capture |
| Auth & bookings | `20250612000000` | profiles, bookings |
| Shop | `20250613000000` | shop_orders |
| Tours CMS mirror | `20250614000000` | tours |
| Affiliates | `20250615–18000000` | Tripster, Sputnik8 |
| Admin & reviews | `20250619–22000000` | admin panel, reviews |
| CMS | `20250620000000` | content_documents |
| Messaging & payments | `20250623000000` | conversations, payments |
| Commissions & analytics | `20250624000000` | commissions, events |
| Realtime & API | `20250625000000+` | messaging v2, api_keys, assistant |

**Важно:** `npm run supabase:migrate` выполняет **все** SQL-файлы подряд. На уже заполненной production БД используйте только **новые** миграции (через SQL Editor или доработайте runner под идемпотентность). Перед первым production cutover БД обычно пустая — полный прогон безопасен.

При использовании Supabase CLI:

```bash
supabase link --project-ref <production-ref>
supabase db push
```

---

## Проверка RLS

### Статический аудит (CI и локально)

```bash
npm run rls-audit
# → var/ops/rls-audit-last.json
```

Правила: каждая таблица `public.*` из миграций должна иметь `ENABLE ROW LEVEL SECURITY`; публичные таблицы — хотя бы одну политику (кроме списка service-role-only в `scripts/rls-audit.mjs`).

### Runtime (админ)

`GET /api/admin/health` — расширенная проверка RLS по живой БД (требует `SUPABASE_SERVICE_ROLE_KEY`).

### После cutover

В Supabase Dashboard → **Authentication** → убедиться, что Site URL и Redirect URLs указывают на production origin.

---

## Smoke tests

### Автоматические

```bash
# Полный readiness (env, RLS, tsc, БД, /api/health)
npm run production-readiness

# Публичные эндпоинты
SMOKE_BASE_URL=https://www.goargentina.ru node scripts/smoke-public.mjs

# Supabase insert smoke (сервер должен быть запущен)
SMOKE_BASE_URL=https://www.goargentina.ru npm run supabase:verify

# Сборка
npm run build
```

### Health endpoint

```http
GET /api/health
```

Ожидаемый фрагмент ответа:

```json
{
  "ok": true,
  "environment": { "nodeEnv": "production", "deployEnv": "production" },
  "migrationVersion": "20250625000002_api_keys",
  "checks": {
    "database": { "ok": true, "skipped": false },
    "migrations": { "latestId": "<latest_migration_id>", "fileCount": 29 }
  }
}
```

### Ручные сценарии (критичные)

| # | Сценарий | Ожидание |
|---|----------|----------|
| 1 | Главная, каталог туров | 200, без ошибок в консоли |
| 2 | Подписка на рассылку | 200, строка в `newsletter_subscribers` |
| 3 | Форма контактов | 200, строка в `contact_submissions` |
| 4 | Вход туриста (email) | redirect, профиль в `profiles` |
| 5 | Создание бронирования | запись в `bookings` |
| 6 | Оплата (sandbox/live по политике) | webhook → `payment_transactions` |
| 7 | Админ: настройки → готовность | нет статуса «Ошибка» по обязательным пунктам |

---

## Откат (rollback)

### Уровень 1 — Откат приложения (быстрый)

1. Vercel → Deployments → **Promote** предыдущий стабильный deployment.
2. Убедиться, что `GIT_SHA` и `migrationVersion` соответствуют откатанной версии.
3. `GET /api/health` — `ok: true`.

Подходит, если новая версия **не ломает** схему БД (только код).

### Уровень 2 — Откат схемы БД

1. Остановить трафик (maintenance).
2. Восстановить дамп из `var/backups/` или внешнего хранилища:
   ```bash
   npm run backup:schema   # перед изменениями — создать свежий дамп
   # Восстановление — через psql / Supabase SQL Editor (только schema)
   ```
3. Откатить deployment приложения к версии, совместимой со схемой.
4. Повторить smoke tests.

**Не делайте** `DROP TABLE` вручную без дампа.

### Уровень 3 — Переключение Supabase project

Если production project повреждён: временно направить `NEXT_PUBLIC_SUPABASE_*` на staging project (только аварийно), затем восстановить production из backup.

---

## Инструменты E72

| Артефакт | Назначение |
|----------|------------|
| `npm run production-readiness` | CLI-проверки, отчёт `var/ops/production-readiness-last.json` |
| `GET /api/health` | Публичный статус, `environment`, `migrationVersion` |
| Админка → Настройки | Панель «Готовность к production» (read-only) |
| `docs/production-cutover-e72.md` | Этот runbook |

### Пример прогона перед production

```bash
cp .env.example .env.local
# заполнить production DATABASE_URL и ключи в .env.local (не коммитить!)

export DEPLOY_ENV=production
npm run production-readiness
npm run rls-audit
npm run build
```

При `fail` в readiness — устранить блокеры до деплоя.

---

## Синхронизация с проектом

| Компонент | Где отображается |
|-----------|------------------|
| `DEPLOY_ENV` | `/api/health`, админка → Настройки |
| `migrationVersion` | `/api/health`, readiness script |
| RLS audit | CI, `var/ops/rls-audit-last.json`, Настройки → Эксплуатация |
| Production readiness | `var/ops/production-readiness-last.json`, Настройки |

Связанные документы: [DEPLOY.md](./DEPLOY.md), [payments-stripe-e66.md](./payments-stripe-e66.md), [public-api-e70.md](./public-api-e70.md).
