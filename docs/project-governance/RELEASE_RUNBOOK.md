# Release and incident runbook

Canonical short path. Details: `docs/DEPLOY.md`, `docs/ops/backup-restore.md`,
`CURRENT_STATE.md`.

## Where production is

- Site: https://www.goargentina.ru
- Health: https://www.goargentina.ru/api/health (`gitSha`, DB, direct PG)
- Partners: https://www.goargentina.ru/api/health/partners
- Vercel: team `go-argentina` / project `argentina-travel`
- Supabase: `uooxrypocahomoqzdvzy`
- GitHub production env: `Production – argentina-travel`

## Normal release

1. Branch `cursor/<name>-5475` from current main (or the surviving RC lineage).
2. PR → `npm run audit:quick` and `npm run release:gate` green.
3. Preview SHA equals PR HEAD.
4. Merge to `main` only when production data plane is healthy enough to accept it.
5. Vercel production deploy of that exact SHA.
6. Confirm `/api/health` `gitSha` matches `origin/main`.
7. `SMOKE_BASE_URL=https://www.goargentina.ru npm run production-smoke`.
8. Recheck catalog APIs, a public form persist (test record + cleanup), partner health.

Do not promote while health is 503 or Vercel is blocked.

## Incident

1. **Detect** — health 503, Sentry, backup workflow, Vercel deploy failure.
2. **Classify** — app vs DB vs quota vs partner vs deploy.
3. **Contain** — stop paid campaigns; disable a partner via existing ops flags, do not swap Supabase project.
4. **Rollback / fix** — app: previous production deployment. DB: restore rehearsal path, never dump onto production ref casually.
5. **Verify** — health, home, `/api/tours`, `/api/excursions`, one persist path.

## DB issue

1. Read `/api/health` (`dependency_quota` vs `unreachable` vs `timeout`).
2. Confirm ref is still `uooxrypocahomoqzdvzy`.
3. If IPv4 ENETUNREACH on `db.<ref>.supabase.co`, use same-ref session pooler `:5432`.
4. If 402, owner billing/spend cap — code cannot clear it.
5. Do not point the app at another project because it answers.

## Disable a failing partner

Use admin partner/operations surfaces in the I3+ candidate. Do not delete
catalog rows to hide an outage. Stale policy must remain: last-known-good or
unavailable, never false empty as “no tours exist”.

## Restore

See `docs/ops/backup-restore.md`. Requires GitHub `production-backup` secrets
and an offline `age` identity. Restore only onto a disposable project.
