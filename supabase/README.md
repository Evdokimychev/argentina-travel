# Supabase — «Пора в Аргентину»

## Анализ: что хранить в БД сейчас

| Данные | Сейчас | Рекомендация |
|--------|--------|--------------|
| Подписка на новости (`FooterNewsletter`) | Заглушка, local state | **БД** — `newsletter_subscribers` |
| Обратная связь (`/contacts`) | Заглушка | **БД** — `contact_submissions` |
| Заявки на консультации (services → `/contacts?service=…`) | Тот же контакт-форма | **БД** — `kind: service_request` / `consultation` |
| Заявка организатора (`/join`) | Заглушка | **БД** — `kind: organizer_application` |
| Контент туров, блог, иммиграция, guide | TS/markdown в `src/data/` | **Код** — CMS/Supabase позже |
| Auth, профиль, роли | Supabase Auth + `profiles` (Phase 2) | **БД** — при `NEXT_PUBLIC_SUPABASE_AUTH` |
| Бронирования | Supabase `bookings` или localStorage fallback | **БД** — Phase 2 |
| Каталог жилья | Не реализован | **Позже** — `listings` + связь с Lustra |
| Lustra | Нет интеграции в репо | **Позже** — `external_id`, sync webhook или read replica |

## Минимальная схема (реализована)

```
newsletter_subscribers   — email, source, locale, status
contact_submissions      — kind, name, email/phone, message, context (jsonb)
```

### `contact_submissions.kind`

- `general` — общая форма контактов
- `tour_inquiry` — вопрос по туру (`context.tour_slug`)
- `service_request` — заявка на сервис (трансфер, страховка…)
- `product_inquiry` — магазин (`context.product_slug`)
- `consultation` — миграционная/визовая консультация
- `organizer_application` — «Стать организатором»

## Будущие таблицы (не создавать без задачи)

| Сценарий | Таблицы |
|----------|---------|
| ЛК пользователя | `profiles` (1:1 auth.users), `user_preferences` |
| Бронирования туров | `bookings`, `booking_travelers`, `booking_payments` |
| Каталог жилья | `housing_listings`, `housing_amenities`, `housing_photos` |
| Lustra | `lustra_property_links` или поле `lustra_id` на listings |
| Туры (CMS) | `tours`, `tour_dates`, … — после выхода из localStorage repository |

## Подключение проекта

### 1. Переменные окружения

Скопируйте `.env.example` → `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # publishable key из Dashboard
```

Опционально для админ-операций: `SUPABASE_SERVICE_ROLE_KEY`  
Для CLI: `DATABASE_URL` (direct Postgres, **не** в клиенте)

### 2. Применить миграцию

**Рекомендуется (локально):**

```bash
# DATABASE_URL должен быть в .env.local
npm run supabase:migrate
```

**Dashboard:** SQL Editor → вставить `supabase/migrations/20250611000000_lead_capture.sql` → Run

**CLI** (если установлен Supabase CLI):

```bash
supabase link --project-ref ejseeuszipxwvdeuqamc
supabase db push
```

### 2.1. Проверка после миграции

```bash
npm run dev          # в отдельном терминале
npm run supabase:verify
```

Ожидается `200 { ok: true }` для newsletter и contact. Тестовые строки появятся в Supabase Dashboard → Table Editor.

### 3. Клиенты в коде

| Файл | Назначение |
|------|------------|
| `src/lib/supabase/client.ts` | Browser (Client Components) |
| `src/lib/supabase/server.ts` | Server Components / cookies |
| `src/lib/supabase/admin.ts` | API routes, service role |
| `src/types/database.ts` | Типы таблиц |

### 4. API

- `POST /api/newsletter` — подписка
- `POST /api/contact` — все contact/lead формы
- `GET /api/exchange-rates` — курсы валют (Frankfurter + fallback)
- `GET /api/admin/leads` — inbox лидов (Bearer `LEADS_ADMIN_TOKEN`, service role)

## Phase 2 — Auth, profiles, bookings

| Компонент | Файлы | Env |
|-----------|-------|-----|
| Supabase Auth + profiles | `supabase-auth-provider.ts`, `AuthContext`, migration | `NEXT_PUBLIC_SUPABASE_*` |
| Middleware `/profile`, `/organizer` | `src/middleware.ts` | — |
| Bookings в Postgres | `bookings` table, `/api/bookings/*` | `SUPABASE_SERVICE_ROLE_KEY` (phone login) |
| Guest → registered | `POST /api/bookings/attach-guest` | — |
| Email при смене статуса | `bookings-notify.ts` | `RESEND_API_KEY`, `LEADS_NOTIFY_EMAIL` |
| Dual mode fallback | `NEXT_PUBLIC_SUPABASE_AUTH=false` | localStorage без изменений |

### Миграция Phase 2

```bash
npm run supabase:migrate   # все файлы в supabase/migrations/ по порядку
```

Файл: `supabase/migrations/20250612000000_auth_profiles_bookings.sql`

### Ручная настройка Supabase Dashboard

1. **Authentication → Providers → Email** — включить Email auth
2. **Authentication → URL Configuration** — Site URL и Redirect URLs (`http://localhost:3000/auth/callback`)
3. При необходимости отключить подтверждение email для dev

### API Phase 2

- `POST /api/bookings` — создать заявку (guest или auth)
- `GET /api/bookings` — бронирования туриста
- `GET/PATCH /api/bookings/[id]` — детали / обновление статуса
- `POST /api/bookings/attach-guest` — привязать гостевые заявки по email
- `GET /api/organizer/bookings` — заявки организатора
- `POST /api/auth/login-by-phone` — вход по телефону (демо-пароль `demo123`)

## Phase 1 — быстрые улучшения

| Функция | Где | Env |
|---------|-----|-----|
| Live курсы валют | `LocaleCurrencyContext`, `/api/exchange-rates` | — |
| Demo-seed off в prod | `bookings-store`, `reviews-store` | `NEXT_PUBLIC_ENABLE_DEMO_SEED` |
| Email при новом лиде | `leads-notify.ts` | `RESEND_API_KEY`, `LEADS_NOTIFY_EMAIL` |
| Inbox лидов | `/admin/leads` | `LEADS_ADMIN_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY` |
| Платежи / отзывы организатора | `/organizer/payments`, `/organizer/reviews` | — |

`robots.txt` закрывает `/admin/` от индексации.

## Деплой (Vercel / др.)

Environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- (optional) `SUPABASE_SERVICE_ROLE_KEY`

После деплоя убедитесь, что миграция применена на production project.

## Безопасность

- RLS: только `INSERT` для `anon` / `authenticated`, без публичного `SELECT`
- Не коммитить `.env.local` и пароль Postgres
- Publishable key безопасен в браузере при включённом RLS
- Если credentials утекли в чат — смените пароль БД в Supabase Dashboard
