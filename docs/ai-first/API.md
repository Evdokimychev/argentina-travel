# API

## Internal (Next.js Route Handlers)

Route handlers в `src/app/api/`. Основные группы:

| Area | Path prefix |
|------|-------------|
| Booking | `/api/booking/` |
| Tours | `/api/tours/` |
| Organizer | `/api/organizer/` |
| CMS | `/api/cms/` |
| CMS governance | `/api/admin/content/documents/:id/governance` |
| Official Argentina FX | `/api/exchange-rates/argentina` |
| Webhooks | `/api/webhooks/` |
| Контент-завод | `/api/admin/content-factory` |
| Публикация по расписанию | `/api/cron/content-factory-publish` |

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

Meta-вебхуки контент-завода и инструкции подключения: [integrations/content-factory-social.md](../integrations/content-factory-social.md).

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

## Content governance API

`GET /api/admin/content/documents/:id/governance` возвращает publication gate, связанные sources, claims, media usages, widgets и доступных reviewers. `POST` добавляет источник/claim или подтверждает claim; `DELETE` удаляет claim либо отвязывает source. Все операции требуют `content.edit`, проходят server-side validation и пишутся в admin audit log.

`PATCH /api/admin/content/documents/:id` также принимает `workflowStage`, `riskLevel`, `reviewerId`, `lastFactCheckedAt`, `nextReviewAt` и `lastSubstantiveUpdateAt`. Публикация и планирование отдельно требуют `content.publish` и всегда вызывают database-backed gate.

`GET /api/exchange-rates/argentina` использует официальный BCRA endpoint, отдаёт только справочный официальный курс, тип котировки, источник и время наблюдения. При ошибке возвращается `503` с `no-store`; статичного «свежего» fallback нет.
