# Деплой

Краткий чек-лист перед выкладкой в production.

## 1. Миграции

```bash
MIGRATION_TARGET_ENVIRONMENT=staging \
MIGRATION_TARGET_PROJECT_REF="$STAGING_SUPABASE_PROJECT_REF" \
SUPABASE_PROJECT_REF="$STAGING_SUPABASE_PROJECT_REF" \
NEXT_PUBLIC_SUPABASE_URL="$STAGING_NEXT_PUBLIC_SUPABASE_URL" \
DATABASE_URL="$STAGING_DATABASE_URL" \
npm run supabase:migrate
```

Команда ведёт собственный журнал с SHA-256 каждого SQL-файла: на чистой базе
применяет 102 baseline-миграции и все следующие за ними, повторный запуск пропускает уже применённые.
Если в `public` уже есть таблицы, но нет канонического журнала, команда
останавливается до любого SQL. Сначала нужно создать и доказать production-like
baseline. Прямой replay поверх production запрещён.

Проверка Supabase:

```bash
npm run supabase:verify
```

Перед изменением production обязательна полная зашифрованная копия с данными:

```bash
npm run backup:full
```

`backup:schema` полезен только для диагностики и не заменяет backup живых данных.
После копии обязательны расшифровка/восстановление в disposable target и
`npm run backup:restore:verify`; см. [`docs/ops/backup-restore.md`](./ops/backup-restore.md).

## 2. Переменные окружения

Скопируйте `.env.example` → `.env.local` / настройки хостинга. Обязательно:

- `NEXT_PUBLIC_SITE_URL`, Supabase keys
- **Auth emails (Supabase):** Custom SMTP + шаблоны — см. [`docs/auth-email-setup.md`](./auth-email-setup.md)
- **Аналитика (I2):** `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_YANDEX_METRIKA_ID` (`110458660`, прямая загрузка в коде, не GTM), токены верификации GSC/Bing/Ahrefs — см. [`docs/i2-analytics-gsc-runbook.md`](./i2-analytics-gsc-runbook.md)
- `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_VAPID_SUBJECT` — для web push (E83)
- `GIT_SHA` — commit SHA (CI и Vercel подставляют автоматически)
- `CRON_SECRET` — обязательная случайная строка не короче 32 символов для всех `/api/cron/*`; без неё cron-маршруты намеренно отвечают `401`
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` — по желанию, для мониторинга ошибок

### Staging (отдельный Supabase-проект)

Используйте **отдельный** проект Supabase для staging — не production.

| Переменная | Назначение |
|------------|------------|
| `STAGING_NEXT_PUBLIC_SITE_URL` | Origin staging-сайта (например `https://staging.goargentina.ru`) |
| `STAGING_NEXT_PUBLIC_SUPABASE_URL` | URL staging-проекта Supabase |
| `STAGING_NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key staging |
| `STAGING_SUPABASE_SERVICE_ROLE_KEY` | Service role staging (только сервер) |
| `STAGING_SUPABASE_PROJECT_REF` | Явный ref staging; независимо сверяется с URL и DATABASE_URL |
| `STAGING_DATABASE_URL` | Postgres connection string staging |

Чек-лист staging-проекта:

- [ ] Создан отдельный проект в [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] Применены 102 baseline-миграции и все последующие с журналом; `MIGRATION_TARGET_PROJECT_REF`, `SUPABASE_PROJECT_REF`, public URL и database URL относятся к одному staging project
- [ ] RLS-аудит пройден: `npm run rls-audit`
- [ ] Data API grants проверены: все необходимые таблицы доступны `service_role`, у `anon` нет непредусмотренного DML
- [ ] `NEXT_PUBLIC_ENABLE_DEMO_SEED=false`
- [ ] `NEXT_PUBLIC_APP_MODE=production` (локальная авторизация и демо-данные исключены из сборки)

Демо-сборка запускается отдельно через `npm run build:demo`; для неё обязательны
`NEXT_PUBLIC_APP_MODE=demo` и `DEMO_DEPLOYMENT=true`. Эти переменные нельзя задавать
production-проекту Vercel.
- [ ] Cron/sync secrets (`CRON_SECRET`, Tripster/Sputnik8) — отдельные или отключены
- [ ] Оплата — только sandbox/test terminal (для первого запуска приоритет Т‑Банк), не production credentials
- [ ] Smoke после деплоя: `SMOKE_BASE_URL=$STAGING_NEXT_PUBLIC_SITE_URL node scripts/smoke-public.mjs`
- [ ] Staging acceptance: все 25 journeys прошли в Chromium и WebKit, нет skip/not_implemented/orphan fixtures

На хостинге (Vercel preview / staging env) подставьте значения `STAGING_*` в соответствующие production-имена (`NEXT_PUBLIC_SUPABASE_URL` и т.д.) для preview-ветки.

## 3. Сборка и smoke

```bash
npm run build
npm run start
# в другом терминале:
npm run smoke
```

Публичные проверки без админ-токена:

```bash
node scripts/smoke-public.mjs
```

Эндпоинты здоровья:

- `GET /api/health` — публичный (версия, git SHA, `environment`, `migrationVersion`, ping БД, миграции)
- `GET /api/admin/health` — для админов (RLS, sync, БД)

Перед production cutover см. **[production-launch-runbook.md](./production-launch-runbook.md)** (под ключ), **[production-cutover-e72.md](./production-cutover-e72.md)** и `npm run publish:verify`.

## 4. CI

GitHub Actions (`.github/workflows/ci.yml`):

- `npm ci`, `tsc`, lint
- **RLS audit** — `node scripts/rls-audit.mjs` (блокирует PR при критичных пропусках политик)
- smoke-public (не блокирует пайплайн без запущенного сервера)

Локально:

```bash
npm run rls-audit
```

Результат пишется в `var/ops/rls-audit-last.json` — отображается в админке (Настройки → Эксплуатация).
