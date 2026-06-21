# Деплой

Краткий чек-лист перед выкладкой в production.

## 1. Миграции

```bash
npm run supabase:migrate
# или Prisma (places):
npm run db:push
```

Проверка Supabase:

```bash
npm run supabase:verify
```

Перед крупными изменениями схемы — резервная копия:

```bash
npm run backup:schema
```

Дамп сохраняется в `var/backups/` (схема public/auth/storage, без данных). Храните копии вне репозитория.

## 2. Переменные окружения

Скопируйте `.env.example` → `.env.local` / настройки хостинга. Обязательно:

- `NEXT_PUBLIC_SITE_URL`, Supabase keys
- **Аналитика (I2):** `NEXT_PUBLIC_GTM_ID`, токены верификации GSC/Bing/Ahrefs — см. [`docs/i2-analytics-gsc-runbook.md`](./i2-analytics-gsc-runbook.md)
- `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_VAPID_SUBJECT` — для web push (E83)
- `GIT_SHA` — commit SHA (CI и Vercel подставляют автоматически)
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` — по желанию, для мониторинга ошибок

### Staging (отдельный Supabase-проект)

Используйте **отдельный** проект Supabase для staging — не production.

| Переменная | Назначение |
|------------|------------|
| `STAGING_NEXT_PUBLIC_SITE_URL` | Origin staging-сайта (например `https://staging.goargentina.ru`) |
| `STAGING_NEXT_PUBLIC_SUPABASE_URL` | URL staging-проекта Supabase |
| `STAGING_NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key staging |
| `STAGING_SUPABASE_SERVICE_ROLE_KEY` | Service role staging (только сервер) |
| `STAGING_DATABASE_URL` | Postgres connection string staging |

Чек-лист staging-проекта:

- [ ] Создан отдельный проект в [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] Применены миграции: `DATABASE_URL=$STAGING_DATABASE_URL npm run supabase:migrate`
- [ ] RLS-аудит пройден: `npm run rls-audit`
- [ ] `NEXT_PUBLIC_ENABLE_DEMO_SEED=false`
- [ ] Cron/sync secrets (`CRON_SECRET`, Tripster/Sputnik8) — отдельные или отключены
- [ ] Mercado Pago — sandbox-токены, не production
- [ ] Smoke после деплоя: `SMOKE_BASE_URL=$STAGING_NEXT_PUBLIC_SITE_URL node scripts/smoke-public.mjs`

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
