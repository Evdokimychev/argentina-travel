# DEPENDENCY_GRAPH

Обновлён по repository + production/candidate evidence 2026-07-29.

```mermaid
flowchart TD
  DNS["goargentina.ru / www"] --> Vercel["Vercel project argentina-travel"]
  Vercel --> Next["Next.js 15 App Router / middleware / route handlers"]
  Next --> Control["CMS site_settings + feature/module control plane"]
  Next --> Resolver["Public catalog/detail resolvers"]
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

Current breaks: clean release ancestry is frozen at `a07327db`, but migration parity is unavailable; Vercel rejected that exact clean candidate because the account is blocked; immutable preview/runtime scope is unavailable; production health is down. Successful earlier deployments `2P6Pnq…` and `D9WetK…` do not prove the clean candidate.

## Data ownership boundaries

- GoArgentina production database is canonical ref `uooxrypocahomoqzdvzy`; other accessible Supabase projects are not evidence.
- Partner APIs own partner booking/payment; GoArgentina owns disclosure, attribution and safe redirect.
- Internal requests require persisted state, notifications, SLA and admin ownership before public promise.
- No B2B product may share production DB/secrets/releases without ADR.
