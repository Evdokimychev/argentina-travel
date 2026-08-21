# ARCHITECTURE

## Обзор

Next.js 15 App Router — server components по умолчанию, client components для интерактива (карты, формы, модалки).

```
PUBLIC UI / APP ROUTER
        ↓
APPLICATION / DOMAIN (src/lib/* domain services)
        ↓
PORTS + INFRASTRUCTURE
  ├── Supabase (authoritative app data plane: auth, bookings, CMS, CRM)
  ├── Prisma (SPECIAL_PURPOSE places adapter only — PLACES_USE_DB)
  └── Partner adapters (Tripster, YouTravel, Sputnik8, Travelpayouts)
        ↓
Vercel
```

Sprint 7 invariants: `npm run architecture:check` · module lifecycle in
`src/lib/modules/business-lifecycle.ts` · current facts in
`docs/project-governance/CURRENT_STATE.md`.

## Persistence (authoritative)

| Domain | Authority | Notes |
|--------|-----------|-------|
| Auth, bookings, CMS, CRM, messaging, analytics | **Supabase** | Primary |
| Places optional DB path | Prisma | Niche; not system of record |
| Partner catalogs | Partner adapters + cache | Sprint 2 invariants |

Do not introduce a second competing ORM for the same aggregate.

## Слои

| Слой | Путь | Ответственность |
|------|------|-----------------|
| Pages | `src/app/` | routing, metadata, data fetching |
| Components | `src/components/` | UI, feature sections |
| Lib | `src/lib/` | domain logic, mappers, API clients |
| Hooks | `src/hooks/` | client state |
| Types | `src/types/` | shared types |

## Feature areas

- **Marketplace tours** — partner + native tours, filters, booking sidebar
- **Excursions** — Tripster catalog, schedule, price quotes, checkout URL
- **Guide / places** — content hub, maps, SEO landing pages
- **Organizer cabinet** — tour editor, CRM, analytics
- **Dormant (quarantined)** — shop, forum, car-rental, transfers (launch clamp)
- **Post-launch** — own online payment, hotels, apartments native catalog
- **CMS / blog** — MD + Supabase content, i18n locales

## Подробные документы

- [argentina-interactive-map-architecture.md](../argentina-interactive-map-architecture.md)
- [visual-page-builder-architecture.md](../visual-page-builder-architecture.md)
- [docs/integrations/](../integrations/) — partner integration design

## Паттерны

- **Mappers** — API response → domain types (`*-mapper.ts`)
- **Repository-style** — data access в `src/lib/*/repository.ts`
- **Feature flags** — `src/lib/feature-flags/` для постепенного rollout
- **Responsive UI tokens** — `src/lib/responsive-ui.ts`, `section-nav-ui.ts`

## Booking flow (упрощённо)

```
User selects date/time
  → client validates + price quote
  → server booking API (partner)
  → checkout URL (Tripster MFE / YouTravel checkout)
```

Tripster anonymous prefilling: только `date` + `time` (HH:MM) из URL. Полный prefilling — External Orders API (требует доступа партнёра).
