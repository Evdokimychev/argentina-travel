# ARCHITECTURE

## Обзор

Next.js 15 App Router — server components по умолчанию, client components для интерактива (карты, формы, модалки).

```
┌─────────────────────────────────────────────────┐
│  Browser (React 19, Tailwind 4)                 │
├─────────────────────────────────────────────────┤
│  Next.js App Router                             │
│  ├── Server Components + Server Actions         │
│  ├── Route Handlers (API)                       │
│  └── Middleware (auth, redirects)               │
├─────────────────────────────────────────────────┤
│  Data layer                                     │
│  ├── Supabase (Postgres, Auth, Storage, RLS)    │
│  ├── Prisma (sync, seed, некоторые queries)     │
│  └── Partner APIs (Tripster, YouTravel, …)      │
├─────────────────────────────────────────────────┤
│  Vercel (hosting, preview deploys)              │
└─────────────────────────────────────────────────┘
```

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
