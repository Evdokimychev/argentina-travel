# Волна E101–E106 — детальное техзадание

**Ветка:** `cursor/organizer-tour-editor-enhancements` (PR #2 → `main`)  
**Порядок реализации (согласован):** E106 → E103 → E104 → E101 → E105 → E102  
**Стек:** Next.js 15 App Router, Supabase, Leaflet, RAG (`src/lib/ai/guide-assistant.ts`), CMS, кабинеты турист/организатор/админ.

---

## Общие требования ко всем эпикам

1. **Системный подход:** каждая фича — сущности, API, RLS, типы `database.ts`, UI турист/организатор/админ где уместно.
2. **Редакционный стандарт:** русский UI, без необоснованных англицизмов; факты по визам/правилам — с оговоркой «уточняйте перед поездкой».
3. **Server/client:** server-only модули не импортировать из client stores/hooks; уведомления через API routes.
4. **RLS:** новые таблицы — `enable row level security` + политики или запись в `SERVICE_ROLE_ONLY_TABLES` + `scripts/rls-audit.mjs`.
5. **Миграции:** `supabase/migrations/20250627XXXXXX_<name>.sql`, без коллизий timestamp.
6. **Feature flags:** при необходимости — `src/lib/feature-flags.ts` + env `NEXT_PUBLIC_*`.
7. **Документация:** `docs/<epic>-eNNN.md` по образцу `docs/inventory-e96.md`.
8. **Не ломать build:** `npm run build` и `npm run rls-audit` должны проходить.

---

## E106 — Центр подготовки к поездке (Trip Prep Hub)

### Цель
Единый раздел «Подготовка к поездке» для туриста с персональным чек-листом перед вылетом, привязанным к бронированию и датам.

### Пользовательские сценарии
- Турист открывает `/profile/trip-prep` или блок на странице заявки `/profile/bookings/[id]`.
- Видит чек-лист по категориям: документы, связь, деньги, здоровье, багаж, трансфер, контакты организатора.
- Отмечает пункты; прогресс сохраняется (Supabase для auth, localStorage fallback).
- За 7/3/1 день до `start_date` — in-app + email напоминание (cron `platform-maintenance` или новый job).
- Организатор видит агрегат «N% туристов завершили подготовку» в CRM заявки (без PII чек-листа).
- Админ: шаблоны чек-листов по типу тура (групповой / индивидуальный / партнёрский).

### Данные
```sql
-- trip_prep_templates (admin)
-- trip_prep_items (template_id, category, title, description, sort_order, required)
-- trip_prep_progress (booking_id, user_id, item_id, checked_at)
-- trip_prep_reminders_sent (booking_id, kind, sent_at) — dedupe
```

### API
- `GET /api/trip-prep?bookingId=` — чек-лист + прогресс
- `PATCH /api/trip-prep/progress` — toggle item
- `GET /api/organizer/bookings/[id]/trip-prep-summary` — % complete
- `GET/PUT /api/admin/trip-prep/templates` — CRUD шаблонов

### UI
- `src/components/trip-prep/TripPrepHub.tsx` — основной вид
- `src/components/trip-prep/TripPrepChecklist.tsx` — категории + progress bar
- Вставка в `ProfileSidebar`, карточку заявки, email-шаблон напоминания
- Seed: дефолтный шаблон «Стандартная поездка в Аргентину» (10–15 пунктов)

### Интеграции
- `bookings-server`, `notifications-server`, cron E71
- i18n keys в `src/locales/ru/common.json` (+ en/es заглушки)
- SEO: `/trip-prep` landing для неавторизованных (статический preview + CTA login)

### Критерии приёмки
- [ ] Чек-лист привязан к booking с `start_date`
- [ ] Прогресс персистентен для logged-in
- [ ] Cron не шлёт дубликаты напоминаний
- [ ] RLS: пользователь видит только свой progress
- [ ] Build + rls-audit зелёные

---

## E103 — Карта Аргентины 2.0

### Цель
Интерактивная карта страны: туры, места, маршруты, климатические зоны — единый hub `/map`.

### База (существующее)
- `ToursCatalogMap`, `PlacesCatalogMap`, `RouteMap`, `PodborRegionMap`
- `src/lib/tour-map.ts`, `src/data/argentina-cities.ts`, `src/data/argentina-climate.ts`

### Новое
- Страница `/map` с слоями (toggle): туры | места | регионы | маршруты
- Кластеризация туров и мест (переиспользовать логику PlacesCatalogMap)
- Фильтры синхронизированы с URL (`?layer=tours&city=...&category=...`)
- Popup: превью карточки + ссылка на тур/место
- Мобильный режим: список снизу + карта сверху (split view)
- GeoJSON границ провинций (упрощённый static JSON в `src/data/argentina-regions.geojson`)
- Подсветка региона при hover из каталога `/tours` (deep link `?highlight=...`)

### API
- `GET /api/map/layers` — агрегированные точки (tours + places) с лимитом и bbox optional
- Кэш CDN helper `src/lib/cdn-cache.ts` (E100) для tile-adjacent data

### SEO
- `generateMetadata` для `/map`
- Structured data `ItemList` для featured tours on map

### Критерии приёмки
- [ ] 4 слоя переключаются без перезагрузки
- [ ] URL отражает состояние фильтров
- [ ] Performance: lazy load Leaflet, не блокировать LCP
- [ ] a11y: aria-labels на карте

---

## E104 — Умный подбор тура (AI v2)

### Цель
Расширить `/podbor` и AI-ассистента: диалоговый подбор тура с учётом каталога, бюджета, дат, состава группы.

### База
- `src/lib/ai/guide-assistant.ts` (RAG по контенту)
- `src/app/podbor/page.tsx`, `PodborRegionMap`

### Новое
- `src/lib/ai/tour-matcher.ts` — scoring туров по intent (region, budget, duration, tags, dates)
- `POST /api/ai/tour-match` — `{ query, filters?, sessionId? }` → ranked tours + explanation
- Session memory: `ai_match_sessions` (user_id nullable, messages jsonb, expires_at)
- UI: чат-панель на `/podbor` + карточки рекомендаций с «Почему этот тур»
- Fallback без OPENAI_KEY: rule-based matcher (как search_fallback в guide-assistant)
- Логирование: `ai_match_events` (anon) для аналитики админки

### Организатор
- Теги тура в редакторе влияют на matching (`audience`, `pace`, `fitness`)
- Поля уже есть частично — синхронизировать с matcher weights

### Критерии приёмки
- [ ] 3+ тура в ответе при наличии в каталоге
- [ ] Объяснение на русском, без выдуманных фактов о турах
- [ ] Rate limit через existing middleware E88
- [ ] Не тянуть server-only в client bundle

---

## E101 — Сообщество и локальные эксперты

### Цель
Каталог локальных экспертов (гиды, консультанты по переезду, фотографы) с профилями и контактом.

### Данные
```sql
-- local_experts (slug, name, bio, city, categories[], languages[], avatar_url, contact_mode, status)
-- expert_categories enum: guide, relocation, photo, family, nature, food
-- expert_inquiries (expert_id, user_id, message, status) — CRM
```

### UI
- `/experts` — каталог с фильтрами город/категория/язык
- `/experts/[slug]` — профиль, отзывы (если есть tours — связь optional)
- CTA: «Написать эксперту» → форма → inbox/message thread (E97 messaging)
- Админ: `/admin/marketplace/experts` — модерация заявок экспертов
- Организатор может подать заявку стать экспертом (reuse `organizer_applications` pattern E98)

### API
- Public: `GET /api/experts`, `GET /api/experts/[slug]`
- `POST /api/experts/[slug]/inquiry`
- Admin CRUD

### Критерии приёмки
- [ ] Минимум 6 seed-экспертов (demo)
- [ ] RLS на inquiries
- [ ] Связь с messaging v2 для thread

---

## E105 — Форум (часть обсуждений открыта)

### Цель
Лёгкий форум: темы по городам/иммиграции/турам; часть разделов публична без регистрации (read-only), постинг — auth.

### Данные
```sql
-- forum_categories (slug, title, description, public_read, sort_order)
-- forum_threads (category_id, author_id, title, pinned, locked, last_post_at)
-- forum_posts (thread_id, author_id, body, edited_at)
-- forum_reactions optional phase 2
```

### UI
- `/forum` — список категорий
- `/forum/[category]` — треды
- `/forum/[category]/[threadId]` — тред + ответы
- Модерация: admin queue reuse `moderation_queue` entity_type `forum_post`
- SEO: indexable public categories only

### API
- `GET` public для `public_read=true` categories
- `POST` threads/posts — authenticated + rate limit
- Report post → moderation

### Критерии приёмки
- [ ] Гости читают открытые категории
- [ ] Спам-защита: rate limit + min account age optional
- [ ] Markdown subset или plain text (без XSS)

---

## E102 — Совместные поездки / групповой набор

### Цель
Туристы создают «набор группы» к дате тура: ищут попутчиков, делят стоимость, организатор подтверждает минимальный состав.

### Данные
```sql
-- group_trip_listings (tour_id, organizer_id, slot_date, min_participants, max_participants, status, description)
-- group_trip_members (listing_id, user_id, status: interested|confirmed|declined, joined_at)
-- link to tour_availability_slots (E96)
```

### UI
- На странице тура: блок «Ищем попутчиков на [дата]»
- `/profile/group-trips` — мои наборы
- Организатор: `/organizer/group-trips` — управление, подтверждение состава
- При достижении `min_participants` — notify organizer + members

### API
- `GET/POST /api/group-trips`
- `POST /api/group-trips/[id]/join|leave`
- `PATCH /api/organizer/group-trips/[id]` — confirm/cancel

### Бронирование
- Не менять payment flow; при join — soft reservation или waitlist link (E96)
- Архитектурно заложить split payment (без реализации оплаты)

### Критерии приёмки
- [ ] Listing привязан к tour + date slot
- [ ] Capacity не превышает slot capacity
- [ ] Notifications on min reached

---

## Зависимости между эпиками

| Epic | Зависит от |
|------|------------|
| E106 | bookings, notifications, cron |
| E103 | tours, places repos, CDN helper |
| E104 | tours cutover E91, guide-assistant, podbor |
| E101 | messaging E97, admin moderation |
| E105 | auth, moderation, rate limits |
| E102 | inventory E96, bookings, messaging |

---

## Чеклист перед merge в main

1. `npm run build` ✓
2. `npm run rls-audit` ✓
3. `npm run supabase:migrate` на staging
4. Vercel preview green
5. Merge PR #2
6. Production migrate + smoke
