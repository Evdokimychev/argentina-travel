# API

## Internal (Next.js Route Handlers)

Route handlers в `src/app/api/`. Основные группы:

| Area | Path prefix |
|------|-------------|
| Booking | `/api/booking/` |
| Tours | `/api/tours/` |
| Organizer | `/api/organizer/` |
| CMS | `/api/cms/` |
| Webhooks | `/api/webhooks/` |

Подробнее: [public-api-e70.md](../public-api-e70.md)

## Partner APIs

| Partner | Docs | Verify command |
|---------|------|----------------|
| Tripster | [integrations/tripster.md](../integrations/tripster.md) | `npm run tripster:verify` |
| Travelpayouts | [integrations/travelpayouts.md](../integrations/travelpayouts.md) | — |
| YouTravel | [integrations/youtravel.md](../integrations/youtravel.md) | `npm run youtravel:verify` |
| Sputnik8 | [integrations/sputnik8.md](../integrations/sputnik8.md) | `npm run sputnik8:verify` |

## Auth

- Supabase Auth (JWT, cookies via `@supabase/ssr`)
- Server: `createClient()` from `src/lib/supabase/server.ts`
- Admin routes — role check

## Rate limiting

См. [rate-limit-e87.md](../rate-limit-e87.md)

## Webhooks

См. [partner-webhooks-e88.md](../partner-webhooks-e88.md)

## Environment variables (API keys)

Server-only (never `NEXT_PUBLIC_*`):

- `TRIPSTER_API_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY`
- Partner-specific keys in `.env.example`

## Testing API changes

```bash
npm test -- src/lib/tripster/
npm run tripster:verify
npm run smoke
```
