# DEPENDENCY_GRAPH

Обновлён по repository + production/candidate evidence 2026-07-29.

```mermaid
flowchart TD
  DNS["goargentina.ru / www"] --> Vercel["Vercel project argentina-travel"]
  Vercel --> Next["Next.js 15 App Router / middleware / route handlers"]
  Next --> Control["CMS site_settings + feature/module control plane"]
  Next --> Resolver["Public catalog/detail resolvers"]
  Next --> Guide["Editorial guide stream"]
  Guide --> Optional["Optional tour embed / Suspense"]
  Optional --> Resolver
  Next --> Auth["Supabase Auth + RLS"]
  Next --> CMS["CMS / knowledge / ingestion"]
  Resolver --> Rest["Supabase Data API snapshots"]
  Resolver --> PG["Direct Postgres recovery path"]
  Resolver --> Partners["Tripster / YouTravel / Sputnik8"]
  Partners --> Affiliate["External checkout / affiliate attribution"]
  CMS --> Storage["Supabase Storage / Reg.ru media"]
  Next --> Ops["Health / cron / jobs / logs / Sentry"]
  Next --> Analytics["Consent → GTM / GA4 / Metrica"]
  GitHub["GitHub Actions release gates"] --> Vercel
  Source["src/app + local import graph"] --> Inventory["Generated route / data / interaction inventory"]
  Inventory --> GitHub
  GitHub --> Backup["Encrypted logical backup workflow"]
  Backup --> Supabase[("Canonical Supabase uoox…")]
  Rest --> Supabase
  PG --> Supabase
  Auth --> Supabase
  CMS --> Supabase
```

## Critical user flow

`browser → page/RSC → resolver → snapshot/partner → typed mapper → catalog/detail → capability-driven CTA → partner outbound or internal persisted request`.

Current production boundary is broken: Supabase REST and deployed direct PG are unavailable. Candidate WP-001 preserves this as `unavailable` and does not alter checkout URLs or create external orders. Candidate WP-002 makes the next action and seller boundary explicit in public copy.

## Release dependency chain

`frozen source SHA → npm ci → type/lint/unit/contracts → build → migration dry-run/parity → preview deployment ID → browser/e2e/smoke → promote same artifact → production SHA/ID → health/catalog/detail/analytics evidence`.

Current breaks: exact SHA `91be7962` is built as deployment `6Y9E1pGV4DD85N5U9JzqztLadTEc` and immutable browser evidence exists, but migration parity and Vercel runtime-log scope are unavailable; preview and production data-plane health are down. The deployment proves the generated-inventory packet and fail-closed behavior, not production readiness.

## Data ownership boundaries

- GoArgentina production database is canonical ref `uooxrypocahomoqzdvzy`; other accessible Supabase projects are not evidence.
- Partner APIs own partner booking/payment; GoArgentina owns disclosure, attribution and safe redirect.
- Internal requests require persisted state, notifications, SLA and admin ownership before public promise.
- No B2B product may share production DB/secrets/releases without ADR.
- Current source topology is recorded in `docs/audit/architecture-current.md`; its data/access candidates remain static evidence until live Supabase and effect tests confirm them.
