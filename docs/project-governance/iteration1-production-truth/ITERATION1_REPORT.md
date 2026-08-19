# Iteration 1 — Production truth, infrastructure recovery & single source release

Generated: 2026-08-19T03:55:00Z  
Agent branch: `cursor/sprint7-architecture-simplify-5475`  
Canonical production: https://www.goargentina.ru

## A. Executive status

**NOT READY**

Infrastructure topology is now **proven and unambiguous**. The data plane is **not healthy**. Two independent, evidenced external blockers remain:

1. Supabase REST/Auth for `uooxrypocahomoqzdvzy` returns **HTTP 402 `exceed_egress_quota`**.
2. Direct Postgres `db.uooxrypocahomoqzdvzy.supabase.co:5432` is **IPv6-only**; IPv4 runtimes (this agent, Vercel) get `ENETUNREACH` in ~25–50 ms.

No READY / GO claim is made. Paid traffic remains **NO-GO**.

## B. Git

| Item | Value |
|------|--------|
| `origin/main` | `81055b1387e0062301ca9c0ae7468cbf782e2511` |
| Sprint 1–6 | In ancestry of `main` (S3 ancestor confirmed; S4 `#27` → S5 `#28` → S6 `#29`) |
| Open product PR | `#30` Sprint 7 (+ Iteration 1 recovery commits) |
| Sprint 7 HEAD at iteration start | `31e3a1ec03db43066272b27f96044b4af9c2b7b6` |
| Competing open PRs | **None** (only `#30`) |
| Merged sprint PRs | `#24`–`#29` |
| Stale sprint branches | Local leftovers of S2–S6; already squash-merged to main |

Sprint 7 CI (run 32085798961) failed for two **harness** reasons, now fixed in this iteration:

- `verify-contracts`: content-contract still expected Python before the **first** `release:gate` after the jobs were split.
- `verify-release`: `--strict-provenance` rewrote committed KB indexes → `dirty-candidate-at-end`.

## C. Vercel

| Field | Evidence |
|-------|----------|
| Canonical team | `go-argentina` (preview/production hostnames `*-go-argentina.vercel.app`) |
| Canonical project | `argentina-travel` |
| Project ID (governance) | `prj_Xjbr4awgjc56swIgwUEmybVd69PP` |
| Team ID (governance) | `team_yWNX34oFl2Yk6lrllqiulis0` |
| Production GitHub env | `Production – argentina-travel` |
| Latest production GitHub deployment | id `5949169997`, SHA `81055b13`, 2026-08-17T18:43Z |
| Immutable URL | `https://argentina-travel-8qa61372x-go-argentina.vercel.app` |
| `www.goargentina.ru` | Vercel DNS `908dd7edff920251.vercel-dns-017.com` → 200 HTML |
| `goargentina.ru` | 308 → `https://www.goargentina.ru/...` |
| Health `gitSha` | `81055b1387e0062301ca9c0ae7468cbf782e2511` = `origin/main` |
| CLI / env inventory | **BLOCKED_EXTERNAL** — no Vercel token in this agent |
| “Account is blocked” | Not observed on current production or Sprint 7 preview deploys (both `success`) |

### Vercel project classification

| Project / env | Role |
|---------------|------|
| `argentina-travel` / team `go-argentina` | **CANONICAL** |
| GitHub env `Production – argentina-travel` | **CANONICAL** production |
| GitHub env `Preview – argentina-travel` | **PREVIEW_ONLY** |
| GitHub env `production-backup` | **LEGACY / backup** (SHA `81055b13` recorded 2026-08-18) |
| GitHub env `Production` (unqualified) | **STALE** naming leftover (last prod events July 2025–style IDs; not serving www) |

Agent cannot list every Vercel account without a token. Classification above is from GitHub Deployments + live DNS + health SHA.

## D. Supabase

| Field | Evidence |
|-------|----------|
| Canonical ref | **`uooxrypocahomoqzdvzy`** — `supabase/config.toml`, production JS (`/_next/static/chunks/30308-*.js`), health `postgresDirect.connection.projectRef`, JWT `ref` claim |
| REST without key | 401 `UNAUTHORIZED_MISSING_API_KEY` + header `sb-project-ref: uooxrypocahomoqzdvzy` (project exists, gateway up) |
| REST / Auth with production **public anon** JWT | **402** `exceed_egress_quota` — spend cap / plan restriction |
| Direct PG DNS | AAAA only (`2600:1f14:359d:9302:611c:6437:5b20:98e0`) — **no A record** |
| Direct PG TCP from IPv4 | `ENETUNREACH` ~51 ms |
| Pooler `aws-0-sa-east-1.pooler.supabase.com` | IPv4 `54.94.90.106` / `15.229.150.166`; TCP 5432 and 6543 **OK** |
| Production health selection | `POSTGRES_URL_NON_POOLING` / `supabase_direct` / 5432 / **verified** same ref |
| Local vs Vercel | Same IPv6-only direct target. Not an env-ref mismatch. Vercel IPv4 cannot open `db.<ref>.supabase.co`. |
| Migration files in repo | 109 files; latest id `20260811040455_final_explicit_data_api_grants` (health metadata only) |
| Live journal / schema / RLS / grants | **NOT_PROVEN** — REST 402; no service-role or direct session from this agent |
| Prisma | SPECIAL_PURPOSE places adapter; not SoR |

Quota is **current**, not historical. Do not treat static/typed homepage 200 as a healthy data plane.

## E. Security

| Check | Status |
|-------|--------|
| Health does not leak connection strings | Pass (public JSON) |
| Anon JWT is public by design (browser bundle) | Expected |
| Live RLS (anon / user / organizer / admin / service) | **NOT_PROVEN** — 402 |
| Grants | **NOT_PROVEN** |
| Sprint 6 static RLS audit | Still in release gate (`rls-audit`) |
| Secret scan this iteration | No secrets committed; fingerprints only |

## F. Backup / restore

| Item | Status |
|------|--------|
| `docs/ops/backup-restore.md` procedure | Exists |
| Encrypted backup created this iteration | **NOT_PROVEN** — no live credentials |
| Disposable restore rehearsal | **BLOCKED_EXTERNAL** |
| Rollback | Redeploy previous SHA on canonical Vercel project; do not swap Supabase ref |

## G. Runtime health (www, 2026-08-19)

| Endpoint | HTTP | Result |
|----------|------|--------|
| `/api/health` | 503 | `down`; database + postgresDirect `dependency_unavailable`; SHA = main |
| `/api/health/public` | 503 | `down` |
| `/api/health/database` | 503 | rest down, postgresDirect down |
| `/api/health/partners` | 503 | tripster/youtravel/sputnik8 down (no DB) |

After this iteration’s code is deployed, REST 402 should surface as `dependency_quota` and IPv6 miss as `dependency_unreachable` — still not healthy, but no longer generic.

## H. Production verification

| URL | HTTP | Note |
|-----|------|------|
| `/` `/tours` `/excursions` `/guide` `/baza-znaniy` `/blog` `/mapa-argentina` `/contacts` | 200 | Static/typed shell — **not** data-plane proof |
| `/robots.txt` `/sitemap.xml` | 200 | Sitemap crawl still reports metadata holes while CMS is quota-restricted |
| Production SHA | `81055b13` | Matches `origin/main` |
| Partner catalog live | **NOT_PROVEN** | health/partners down |

## I. Closed / fixed this iteration (code)

- Sprint 7 CI contract for split jobs (Python before **content** gate only).
- `--strict-provenance` is check-only (no KB index rewrite → no dirty candidate).
- Health classifies `dependency_quota` and `dependency_unreachable`.
- Verified session pooler is preferred over IPv6-only direct when both URLs exist.
- Canonical topology + quota/IPv6 root causes documented as current facts.

## J. Remaining issues

- Data plane down (quota + IPv6 direct).
- Live migration parity / RLS / grants.
- Backup/restore rehearsal.
- Vercel production env fingerprint (no CLI token).
- SEO live baseline against production sitemap while CMS is 402 (non-blocking in gate).
- Main historical CI `production-acceptance` / post-merge jobs still red (data-plane dependent).

## K. External blockers (agent cannot complete)

1. **Supabase owner:** remove spend cap / upgrade plan so `exceed_egress_quota` is cleared on `uooxrypocahomoqzdvzy`.
2. **Supabase/Vercel owner:** add a **same-ref** session pooler URL (`POSTGRES_URL` or `DATABASE_URL`, `*.pooler.supabase.com:5432`, user `postgres.<ref>`) so IPv4 serverless can reach Postgres. Do not point at another project.
3. **Optional:** Vercel read token for full env inventory; not required to identify canonical project.
4. After (1)+(2): run live RLS, migration journal, `backup:full` + disposable restore.

## L. Recommendation for Iteration 2

**NO-GO** for public product / content / marketplace hardening as a *production* program.

**CONDITIONAL GO** for Iteration 2 **code-only** work that does not require a healthy data plane (editorial files, UX on static paths), only after Sprint 7 CI is green and merged.

Iteration 2 must not assume live catalog, CMS, bookings, or analytics until blockers 1–2 are cleared and `/api/health` is `ok` on SHA = `origin/main`.
