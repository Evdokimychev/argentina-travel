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
- `GET /api/admin/leads` — inbox лидов (Supabase session + capability `operations.leads`)

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

## Phase 3 — Shop orders (PDF guides)

| Компонент | Файлы | Env |
|-----------|-------|-----|
| Таблица `shop_orders` | migration `20250613000000_shop_orders.sql` | `NEXT_PUBLIC_SUPABASE_*` |
| Self-serve checkout | `ShopCheckoutModal`, `/shop/[slug]` | `NEXT_PUBLIC_SUPABASE_AUTH` |
| ЛК туриста | `/profile/orders` | — |
| Админ заказов | `/admin/operations/shop-orders`, `/api/admin/shop/orders` | Supabase session + `operations.shop` |
| Email при заказе | `shop-order-notify.ts` | `RESEND_API_KEY`, `LEADS_NOTIFY_EMAIL` |
| Dual mode fallback | без Supabase → `/contacts?product=slug` | `NEXT_PUBLIC_SUPABASE_AUTH=false` |

### Миграция Phase 3

```bash
npm run supabase:migrate   # применит 20250613000000_shop_orders.sql
```

### API Phase 3

- `POST /api/shop/orders` — создать заказ (guest или auth)
- `GET /api/shop/orders` — заказы авторизованного пользователя
- `GET /api/shop/orders/[id]` — детали заказа
- `GET /api/admin/shop/orders` — все заказы (Supabase session + `operations.shop`)

Поля `delivery_url` и `storagePath` в каталоге — задел под signed URL из Supabase Storage; оплата вручную менеджером.

## Phase 4 — Tours content (CMS mirror)

| Компонент | Файлы | Env |
|-----------|-------|-----|
| Таблица `tours` | migration `20250614000000_tours_content.sql` | `NEXT_PUBLIC_SUPABASE_TOURS` |
| Публичный каталог | `fetchMarketplaceTours`, `/api/tours` | `NEXT_PUBLIC_SUPABASE_AUTH` |
| Синхронизация организатора | `organizer-tour-store` → `/api/organizer/tours/sync` | — |
| Sitemap | `collectTourSitemapPaths` | — |
| Админ | `/admin/marketplace/tours` | Supabase session + `marketplace.tours` |
| Dual mode fallback | localStorage + `marketplace-tours` seed | `NEXT_PUBLIC_SUPABASE_TOURS=false` |

Редактор организатора остаётся на localStorage; Supabase — зеркало опубликованного каталога для SSR/SEO.

### Миграция Phase 4

```bash
npm run supabase:migrate   # применит 20250614000000_tours_content.sql
```

### Seed каталога из статики

```bash
npm run supabase:seed-tours   # напрямую через service role (SUPABASE_SERVICE_ROLE_KEY)
```

Или `POST /api/admin/tours/seed` из браузера под учётной записью администратора.

### API Phase 4

- `GET /api/tours` — опубликованные листинги
- `GET /api/tours/[slug]` — детальная страница тура
- `POST /api/organizer/tours/sync` — upsert после publish (organizer auth)
- `GET /api/admin/tours` — все туры (Supabase session + `marketplace.tours`)
- `POST /api/admin/tours/seed` — seed из `marketplace-tours`

## Phase 1 — быстрые улучшения

| Функция | Где | Env |
|---------|-----|-----|
| Live курсы валют | `LocaleCurrencyContext`, `/api/exchange-rates` | — |
| Demo-seed off в prod | `bookings-store`, `reviews-store` | `NEXT_PUBLIC_ENABLE_DEMO_SEED` |
| Email при новом лиде | `leads-notify.ts` | `RESEND_API_KEY`, `LEADS_NOTIFY_EMAIL` |
| Inbox лидов | `/admin/operations/leads` | Supabase session + `operations.leads` |
| Платежи / отзывы организатора | `/organizer/payments`, `/organizer/reviews` | — |

`robots.txt` закрывает `/admin/` от индексации.

## Phase 5 — Tripster affiliate catalog (`/excursions`)

| Компонент | Файлы | Env |
|-----------|-------|-----|
| Tripster API client | `src/lib/tripster/*` | `TRIPSTER_PARTNER`, `TRIPSTER_SECRET` |
| Affiliate links | `src/lib/travelpayouts/*` | `TRAVELPAYOUTS_*` |
| Catalog mirror | `tripster_*` tables | `DATABASE_URL` или `SUPABASE_SERVICE_ROLE_KEY` |
| Sync | `npm run tripster:sync` | все ключи выше |
| UI | `/excursions`, `/excursions/[slug]` | `DATABASE_URL` достаточно для SSR через pg fallback |

### Миграция Phase 5

**Если `npm run supabase:migrate` не подключается (IPv6):**

1. Supabase Dashboard → **SQL Editor**
2. Вставить содержимое `supabase/all-migrations.sql` (или файлы из `supabase/migrations/` по порядку)
3. Run

**Или Session pooler URI:** Dashboard → Database → Connection string → **Session pooler** → заменить `DATABASE_URL` в `.env.local` → `npm run supabase:migrate`

### Проверка и синхронизация

```bash
npm run tripster:verify   # Travelpayouts + Tripster + города Аргентины
npm run tripster:sync     # города + экскурсии + affiliate-ссылки
```

`TRIPSTER_SECRET` для канала Travelpayouts — в [инструкции Travelpayouts](https://support.travelpayouts.com/hc/ru/articles/360028527251-API-от-Tripster) (partner `travelpayoutsapi`).

Для UI также нужны `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Dashboard → API). Без anon key SSR читает каталог через `DATABASE_URL`.


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
