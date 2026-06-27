# Travelpayouts — affiliate links и whitelabel

## Официальная документация

| Раздел | URL |
|--------|-----|
| API создания ссылок | https://support.travelpayouts.com/hc/ru/articles/360016804119 (Links API) |
| Tripster API через Travelpayouts | https://support.travelpayouts.com/hc/ru/articles/360028527251 |
| Whitelabel (авиа) | https://support.travelpayouts.com/hc/ru/articles/203956163 |
| Intui transfers API | https://support.travelpayouts.com/hc/ru/articles/360016804119 |
| Airalo feed | https://support.travelpayouts.com/hc/ru/articles/17131439719826 |

## Переменные окружения

| Переменная | Назначение |
|------------|------------|
| `TRAVELPAYOUTS_API_KEY` | Токен для Links API (`X-Access-Token`) |
| `TRAVELPAYOUTS_MARKER` | Partner marker (sub_id tracking) |
| `TRAVELPAYOUTS_TRS` | Traffic source id |
| `TRAVELPAYOUTS_SHORTEN_LINKS` | `true` → короткие `tp.media` ссылки |
| `NEXT_PUBLIC_TRAVELPAYOUTS_WL_ID` | Whitelabel widget id (авиа, страхование) |

## Links API — обёртка партнёрских URL

```http
POST https://api.travelpayouts.com/links/v1/create
Content-Type: application/json
X-Access-Token: {TRAVELPAYOUTS_API_KEY}

{
  "trs": 427300,
  "marker": 434047,
  "shorten": true,
  "links": [
    {
      "url": "https://experience.tripster.ru/experience/booking/50900/?date=2026-09-01&time=10:00:00&persons_count=2",
      "sub_id": "tripster:buenos-aires:50900"
    }
  ]
}
```

### Response (пример)

```json
{
  "code": "success",
  "status": 200,
  "result": {
    "trs": 427300,
    "marker": 434047,
    "shorten": true,
    "links": [
      {
        "url": "https://tp.media/r?marker=434047&u=https%3A%2F%2F…",
        "code": "success",
        "partner_url": "https://tp.media/r?marker=434047&u=https%3A%2F%2F…"
      }
    ]
  }
}
```

> **Важно (из документации Travelpayouts):** ссылки на Tripster **обязательно** создавать через Links API или кабинет Travelpayouts. Прямые URL без marker не учитывают продажи.

Реализация: `src/lib/travelpayouts/client.ts`

### Обёртчики по партнёрам

| Функция | sub_id prefix | Целевой URL |
|---------|---------------|-------------|
| `createTripsterAffiliateLink` | `tripster:{citySlug}:{experienceId}` | Tripster experience/booking/order |
| `createYouTravelAffiliateLink` | `youtravel:{country}:{tourId}` | youtravel.me/tours/… |
| `createSputnik8AffiliateLink` | `sputnik8:{citySlug}:{productId}` | sputnik8.com/… |

## Формат tp.media wrapper

```
https://tp.media/r?marker={MARKER}&u={urlencode(targetUrl)}
```

- Параметр **`u`** — полный целевой URL **включая query string** (date, time, contacts).
- При разборе ссылок извлекать embedded URL: `new URL(tpUrl).searchParams.get("u")`.
- Реализация: `extractTripsterExperienceId` в `src/lib/tripster/checkout-url.ts`

## Whitelabel (авиа, страхование)

Не связан с Tripster booking. Embed через скрипт:

```
https://tpscr.com/wl_web/main.js?wl_id={NEXT_PUBLIC_TRAVELPAYOUTS_WL_ID}
```

| Страница | Компонент |
|----------|-----------|
| `/flights` | `src/components/flights/FlightsWhitelabelWidget.tsx` |
| `/insurance` | `src/components/insurance/InsuranceWhitelabelWidget.tsx` |
| Embed | `src/app/embed/flights/wl/` |

Конфиг: `src/lib/travelpayouts/whitelabel/config.ts`

## Aviasales Data API (вспомогательно)

Автокомплит аэропортов, deep links — `src/lib/travelpayouts/aviasales/`.  
Не путать с Links API.

## Реализация в репозитории

| Задача | Файлы |
|--------|-------|
| Links API client | `src/lib/travelpayouts/client.ts`, `env.ts`, `types.ts` |
| Tripster wrap | `src/lib/tripster/checkout-url-server.ts` |
| Redirect endpoint | `src/app/api/affiliate/go/[slug]/route.ts` |
| Flights affiliate | `src/lib/travelpayouts/flights-affiliate.ts` |
| Price widgets | `src/lib/travelpayouts/price-widget-config.ts` |

## Правила для агентов

1. **Не** открывать «голые» Tripster/YouTravel URL в production, если `isTravelpayoutsConfigured()` — теряется атрибуция.
2. При построении booking deep link **сначала** собрать полный target URL с query params, **потом** обернуть через Links API.
3. `partner_url` и `url` в ответе Links API — использовать `partnerUrl ?? url`.
4. Whitelabel и Links API — разные продукты; не смешивать env и endpoints.

## Связь с prefilling Tripster

Цепочка в `resolveTripsterAffiliateCheckoutUrl`:

1. `buildTripsterPartnerBookingUrl(...)` — target с params
2. `createTripsterAffiliateLink({ tripsterUrl: target })` — tp.media wrapper
3. Клиент при fallback **не пересобирает** URL — берёт `fallbackUrl` с сервера (коммит `18e8728`)

Подробнее: [tripster.md](./tripster.md)
