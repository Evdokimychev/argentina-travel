# Интеграция YouTravel.me — план из 5 спринтов

Партнёрская программа: [YouTravel.me API](https://ytme.atlassian.net/wiki/spaces/6NPNZvyRfa10/pages/2783904156/YouTravel.me+API).  
Архитектурный ориентир — зеркало Tripster (`src/lib/tripster/*`): синхронизация в Postgres, маппинг в `TourListing` / `TourDetail`, единый каталог и карточка бронирования на дизайне сайта.

## Влияние изменений на проект

| Область | Изменения |
|---------|-----------|
| **Сущности** | `youtravel_tours`, `youtravel_offers`, `youtravel_sync_runs`, `youtravel_booking_requests` |
| **Публичные страницы** | `/tours`, `/tours/[slug]`, главная (рекомендации), embed |
| **Фильтры** | `filter-tours.ts` — поля из YouTravel (страна, длительность, цена, даты заездов) |
| **Бронирование** | Карточка тура → заявка через API / affiliate fallback |
| **ЛК туриста** | Блок «Заявки YouTravel» (как Tripster) |
| **Админка** | Статус синка, последние заявки, без редактора тура |
| **Аналитика** | `partnerSource: youtravel`, affiliate click tracking |
| **Будущее** | Оплата на платформе не затрагивается; заявки — lead + партнёрская комиссия |

---

## Спринт 1 — Фундамент API и зеркало БД ✅

**Цель:** безопасное подключение к API, схема Postgres, verify/sync, каркас клиента.

- [x] `YOUTRAVEL_API_*` в `.env.example`
- [x] HTTP-клиент с BasicAuth + fallback (api key / bearer), rate limit
- [x] Миграция `youtravel_tours` + `youtravel_offers` + `youtravel_sync_runs`
- [x] `npm run youtravel:verify` / `youtravel:sync`
- [x] `partnerSource: "youtravel"` в типах
- [ ] **Auth 401** — нужна активация API в кабинете или уточнение у a.golik@youtravel.me

### Affise vs каталог YouTravel

| API | Base URL | Auth | Назначение |
|-----|----------|------|------------|
| **Каталог туров** | `https://youtravel.me/api` | BasicAuth (email + password) | `/v1/tours`, `/v1/tours/{id}/offers` — синк каталога |
| **Affise (статистика)** | `https://api-travelme.affise.com` | заголовок `API-Key` | `/3.0/stats/*` — конверсии, клики, отчёты партнёра |

Ключ из [документации Affise](https://api-travelme.affise.com/docs3.1/) (`23df424b…`) — **пример из доков**, не рабочий ключ. Для синка туров нужен отдельный доступ к `youtravel.me/api`, не Affise.

Проверка: `npm run youtravel:verify` — каталог (обязательно) + Affise (опционально, если задан `YOUTRAVEL_AFFISE_API_KEY`).

---

## Спринт 2 — Синхронизация каталога и маппинг ✅ (код)

**Цель:** туры YouTravel в общем каталоге с фильтрами.

- [x] Полный sync с пагинацией + sync офферов (зaezды)
- [x] Фильтр `YOUTRAVEL_SYNC_COUNTRY=argentina`
- [x] Маппер `TourListing` / `TourDetail` + даты в каталоге
- [x] Merge в `fetchMarketplaceTours`
- [x] Affiliate через Travelpayouts + `/api/affiliate/go/[slug]` для `-yt{id}`
- [x] Cron `GET /api/cron/youtravel-sync` + включён в `affiliate-sync`
- [x] Бейдж «Партнёр YouTravel.me» на карточках
- [ ] **Данные в каталоге** — после успешного `youtravel:sync`

**Критерий:** `/tours` показывает партнёрские туры YouTravel (после auth + sync).

---

## Спринт 3 — Полная карточка тура ✅ (код)

**Цель:** страница тура неотличима по UX от нативной.

- [x] Sync офферов (заезды) → `availableDates` и `TourDetail.dates`
- [x] `partnerContent` + программа по дням, галерея, включено/не включено, организатор
- [x] `GET /api/youtravel/tours/[slug]/offers` + ветка YouTravel в `/api/partner-tours/[slug]/schedule`
- [x] Чтение туров из БД без API credentials; live offers при наличии auth
- [x] `PartnerTourBanner` / `PartnerTourDatesSection` — брендинг YouTravel vs Tripster
- [x] `generateStaticParams` включает youtravel-slugs
- [ ] **Данные на странице** — после успешного `youtravel:sync` и auth для live offers

**Критерий:** `/tours/[slug]` для youtravel-тура — полное описание, даты, цена в валюте партнёра.

---

## Спринт 4 — Фильтры, поиск, discovery ✅ (код)

**Цель:** фильтры каталога работают с партнёрским контентом.

- [x] Фильтр по датам заезда для YouTravel (`availableDates` из `youtravel_offers`); Tripster по-прежнему без фильтра по датам
- [x] Фильтр по бюджету для YouTravel (`partnerPriceValue` / `partnerPriceCurrency` → USD)
- [x] Длительность, тип активности, размер группы — из маппера `partner-tour-repository`
- [x] Meilisearch / FTS: `collectTourItems()` индексирует партнёрские туры через `fetchMarketplaceTours`
- [x] Главная: блок «Авторские туры YouTravel» (до 6 туров, если есть в каталоге)
- [x] Карта: геоточки с fallback по городу; координаты 0,0 не попадают на карту
- [x] Дедупликация slug: платформа побеждает; YouTravel — суффикс `-yt{id}` (тест)
- [ ] **Данные в фильтрах** — после успешного `youtravel:sync`

**Критерий:** фильтры на `/tours` корректно сужают youtravel-туры (после sync).

---

## Спринт 5 — Бронирование и ЛК ✅ (код)

**Цель:** форма на сайте отправляет заявку (или мягкий fallback).

- [x] `POST /api/youtravel/booking-request` + `GET` для заявок пользователя
- [x] Миграция `youtravel_booking_requests`
- [x] `src/lib/youtravel/booking-requests-server.ts` — insert, fetch, admin stats
- [x] `src/types/youtravel-booking.ts` — view type
- [x] Affiliate fallback: `/api/affiliate/go/{slug}` с query params (дата, туристы, контакты)
- [x] Stub `createYouTravelBookingRequest` — пробует API, при 401/404 → affiliate_fallback
- [x] `PartnerTourBookingContactSection` — ветка YouTravel
- [x] `/profile/bookings` — блок «Заявки YouTravel.me»
- [x] Админка: заявки YouTravel в разделе «Экскурсии»
- [x] Unit-тесты fallback URL
- [ ] **E2E smoke** — выбор даты → submit → запись в БД (после миграции)
- [ ] **Live API** — после активации каталога/API в кабинете YouTravel

**Критерий:** пользователь заполняет форму на сайте; заявка сохраняется в БД и перенаправляет на YouTravel.me (affiliate fallback) или уходит через API, если доступен.

---

## Переменные окружения

```bash
# Каталог туров (синк, live offers)
YOUTRAVEL_API_BASE=https://youtravel.me/api
YOUTRAVEL_API_EMAIL=          # email из личного кабинета (BasicAuth login)
YOUTRAVEL_API_PASSWORD=       # пароль из кабинета
YOUTRAVEL_SYNC_COUNTRY=argentina
# YOUTRAVEL_AFFILIATE_PARAM=  # sub_id / partner marker из кабинета

# Affise — только статистика партнёра (не каталог)
YOUTRAVEL_AFFISE_API_BASE=https://api-travelme.affise.com
YOUTRAVEL_AFFISE_API_KEY=     # API-Key из профиля Affise / партнёрского кабинета
```

## Поддержка

- API: a.golik@youtravel.me  
- Техподдержка: через [центр помощи партнёров](https://ytme.atlassian.net/wiki/spaces/6NPNZvyRfa10)
