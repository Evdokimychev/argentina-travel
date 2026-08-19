# Infrastructure Recovery Evidence — Iteration 6

Generated: 2026-08-19

## Canonical topology (unchanged)

```
GitHub Evdokimychev/argentina-travel
  → Vercel team go-argentina / project argentina-travel
  → www.goargentina.ru
  → Supabase uooxrypocahomoqzdvzy
```

## Supabase `uooxrypocahomoqzdvzy`

| Check | Agent env result | Production (live curl) |
|-------|------------------|------------------------|
| Project ref | canonical | canonical in `/api/health` migration metadata |
| REST | DNS resolve failed in agent pod | prior audit: 402 exceed_egress_quota |
| Auth health | DNS resolve failed | not re-tested live this turn |
| Session pooler | SSL probe inconclusive | required for IPv4 Vercel runtime |
| Direct PG 5432 | not reachable | prior: IPv6-only ENETUNREACH |

**Agent limitation:** cloud agent egress could not resolve `*.supabase.co` hostnames. Production health still reports `dependency_timeout` after 5s.

## Vercel

- Production serves SHA `81055b13` (matches `main`).
- Prior "Account is blocked" claim in `CURRENT_STATE.md` may be stale (PR #34 had green Vercel check per audit); fresh deploy not attempted pre-merge.
- No Vercel CLI credentials in agent environment.

## Environment variables (presence only)

Agent workspace: no `.env` / `.env.local`. Production secrets not readable (by design).

Expected production names: `DATABASE_URL`, `POSTGRES_URL`, `DIRECT_URL`, `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## Actions taken autonomously

- CI Playwright install made deterministic (no `--with-deps`, step timeout).
- Evidence pipeline hardened against stale artifact contamination.
- No alternate Supabase project used as workaround.

## Remaining external owner actions

1. Restore Supabase quota / billing on `uooxrypocahomoqzdvzy`.
2. Confirm Vercel team billing / deploy permissions.
3. Set production backup secrets and run disposable restore rehearsal.
