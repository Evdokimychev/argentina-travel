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

## 2. Переменные окружения

Скопируйте `.env.example` → `.env.local` / настройки хостинга. Обязательно:

- `NEXT_PUBLIC_SITE_URL`, Supabase keys
- `GIT_SHA` — commit SHA (CI и Vercel подставляют автоматически)
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` — по желанию, для мониторинга ошибок

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

- `GET /api/health` — публичный (версия, опциональный ping БД)
- `GET /api/admin/health` — для админов (RLS, sync, БД)

## 4. CI

GitHub Actions (`.github/workflows/ci.yml`): `npm ci`, `tsc`, lint, smoke-public (не блокирует пайплайн без запущенного сервера).
