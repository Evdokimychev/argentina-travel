# YouTravel.me — Partner API и бронирование

## Официальная документация

| Раздел | URL |
|--------|-----|
| YouTravel.me API (каталог) | https://ytme.atlassian.net/wiki/external/NTA0ZDQ5OTRhODFjNDcwYjkxMzBjMWVlNWY0YmNlMjE |
| Affise stats API | https://api-travelme.affise.com/docs3.1/ |
| План интеграции в проекте | `docs/youtravel-integration-sprints.md` |

## Два разных API (не путать)

| API | Base URL | Auth | Назначение |
|-----|----------|------|------------|
| **Каталог туров** | `https://youtravel.me/api` | BasicAuth (email + password) | `/v1/tours`, offers, booking |
| **Affise (статистика)** | `https://api-travelme.affise.com` | Header `API-Key` | Конверсии, клики — **не каталог** |

## Переменные окружения

| Переменная | Назначение |
|------------|------------|
| `YOUTRAVEL_API_BASE` | `https://youtravel.me/api` |
| `YOUTRAVEL_API_EMAIL`, `YOUTRAVEL_API_PASSWORD` | BasicAuth |
| `YOUTRAVEL_AUTH_MODE` | `basic_password` (default) |
| `YOUTRAVEL_PARTNER_PID` | Partner id для affiliate |
| `YOUTRAVEL_AFFISE_API_BASE`, `YOUTRAVEL_AFFISE_API_KEY` | Affise snapshots |
| `YOUTRAVEL_WEBHOOK_SECRET` | Webhook статусов бронирования |

Проверка: `node scripts/youtravel-verify.mjs`

## Каталог — ключевые endpoints

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/v1/tours` | Список туров (пагинация) |
| GET | `/v1/tours/{id}` | Детали тура |
| GET | `/v1/tours/{id}/offers` | Зaezды / офферы |

Реализация: `src/lib/youtravel/client.ts`, `scripts/youtravel-sync.mjs`

## Booking API

Пробуются endpoints по порядку (`src/lib/youtravel/booking-api.ts`):

1. `POST /v1/booking-requests`
2. `POST /v1/orders`

### Request body (пример)

```json
{
  "tour_id": 52537,
  "offer_id": 12345,
  "start_date": "2026-10-01",
  "end_date": "2026-10-10",
  "persons_count": 2,
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  "phone": "+79991234567",
  "message": "Комментарий"
}
```

### Response (типичный)

```json
{
  "id": "abc123",
  "status": "pending",
  "url": "https://youtravel.me/tours/52537?…"
}
```

| HTTP | Поведение проекта |
|------|-------------------|
| 401 / 404 на обоих endpoints | `affiliate_fallback` |
| 422 | `api_booking_rejected` → fallback |

Route: `src/app/api/youtravel/booking-request/route.ts`

## Prefilling — fallback URL (query params)

Базовый builder: `buildYouTravelPartnerBookingUrl` в `src/lib/youtravel/partner-tour-utils.ts`

```
https://youtravel.me/tours/{pathSegment}?start_date=…&end_date=…&guests=…&offer_id=…&name=…&email=…&phone=…
```

| Param | Назначение |
|-------|------------|
| `start_date`, `end_date` | Даты заезда |
| `guests` | Число туристов |
| `offer_id` | Конкретный оффер |
| `name`, `email`, `phone` | Контакты (best-effort) |

Affiliate wrap: `createYouTravelAffiliateLink` → tp.media (как Tripster).

Redirect: `/api/affiliate/go/{slug}?start_date=…&guests=…` для slug `-yt{id}`.

### Ловушка cached `partner_url`

`isUsableYouTravelAffiliateRedirectUrl` отклоняет URL с `/lk/pay` — это payment deep link из Affise, не tourist booking.

## Travelpayouts wrapper

```typescript
createYouTravelAffiliateLink({
  youtravelUrl: bookingTarget,
  tourId,
  country,
})
// sub_id: youtravel:argentina:52537
```

## Реализация в репозитории

| Задача | Файлы |
|--------|-------|
| Booking API | `src/lib/youtravel/booking-api.ts` |
| Booking route | `src/app/api/youtravel/booking-request/route.ts` |
| Fallback utils | `src/lib/youtravel/partner-tour-utils.ts`, `partner-tour/affiliate-fallback.ts` |
| UI | `src/components/tour-detail/PartnerTourBookingContactSection.tsx` |
| Webhook | `src/app/api/webhooks/youtravel/booking/route.ts` |
| Sync | `scripts/youtravel-sync.mjs`, cron `/api/cron/youtravel-sync` |
| E2E | `tests/e2e/youtravel-booking.spec.ts`, `youtravel-partner-invariants.spec.ts` |

## Slug convention

`{transliterated-title}-yt{tourId}` — см. `buildYouTravelTourSlug`.

## Чеклист для агентов

- [ ] Каталог: `YOUTRAVEL_API_BASE` = `youtravel.me/api`, **не** Affise URL
- [ ] Booking fallback → `buildYouTravelPartnerBookingUrl` + Travelpayouts wrap
- [ ] Не использовать cached `partner_url` с `/lk/pay`
- [ ] Slug `-yt{id}` → affiliate go route в `src/app/api/affiliate/go/[slug]/route.ts`
