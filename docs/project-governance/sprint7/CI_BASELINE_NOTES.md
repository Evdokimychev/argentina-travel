# Sprint 7 — CI baseline notes

Source: `.github/workflows/ci.yml`, `scripts/release-gate.mjs`, related npm scripts. Measurement only. 2026-08-18.

---

## 1. Workflow shape

**File:** `.github/workflows/ci.yml`

**Triggers:** `push` to `main`/`master`; all `pull_request`.

**Permissions:** `contents: read`. Concurrency `ci-${{ workflow }}-${{ ref }}` with `cancel-in-progress: true`.

### Job `verify` (every PR + push)

Env highlights: `NEXT_PUBLIC_APP_MODE=production`, `NEXT_PUBLIC_ENABLE_DEMO_SEED=false`, placeholder Supabase URL `http://127.0.0.1:9` (fail-fast, no real credentials), Playwright Chromium installed.

| Step | Blocking? | Notes |
|------|-----------|--------|
| Checkout (`fetch-depth: 0`) | yes | Full history |
| Setup Python 3.12 + `requirements-content.txt` | yes | Knowledge provenance in release-gate |
| `npm ci` | yes | |
| Playwright Chromium + deps | yes | Before gate (journeys need browser) |
| **`npm run release:gate`** | **yes** | Nested full quality matrix (below) |
| Upload `var/ops/release-gate-report.json` + logs | always | `if-no-files-found: error` |
| `npm run bundle:report` | **no** (`continue-on-error`) | Soft |
| `node scripts/lighthouse-phase2-ci.mjs` | **yes** | Starts local server; 3 cold mobile runs; budgets |
| Upload LH artifacts | always | |
| `npm run test:e2e:ux-audit` | **no** | Soft / legacy-ish |

### Job `production-acceptance` (push `main` only)

`needs: verify`. Against live `https://www.goargentina.ru`:

1. Wait up to ~10 min for `/api/health` `gitSha === GITHUB_SHA` (allows HTTP 503 body)
2. `npm run production-smoke`
3. `npm run test:e2e:stage2-visual` + gallery artifact

---

## 2. What `release:gate` nests

**Script:** `scripts/release-gate.mjs` (`npm run release:gate`).  
Default group order: `static` → `contracts` → `content` → `security` → `commerce` → **`production`** → **`journeys`**.  
Per-group entry stops the whole gate on first **blocking** failure.

| Group | Nested checks (blocking unless noted) |
|-------|----------------------------------------|
| **static** | `validate-build-mode`, secrets audit, `audit:deps:policy`, node `--test` on many `scripts/lib/*.test.mjs`, **`tsc --noEmit`**, **`lint`**, `inventory:check` |
| **contracts** | **`npm test`** (full vitest), `sync-manual-posts:check`, `sync-rich-articles:check`, `sync-content-plan-redirects:check` |
| **content** | Python knowledge `--strict-provenance`, blog/guide editorial `:check`, `content:audit`, `seo-audit` (**non-blocking**), `media:integrity`, `media:critical:check`, `media:rights:check` |
| **security** | `rls-audit`; `auth:readiness` **skipped when `CI` set** |
| **commerce** | Targeted vitest booking/payment/database integrity suite (subset, not full `npm test` again conceptually but re-runs specific files) |
| **production** | **`npm run build`** (full Next production build) + `scan-production-artifacts.mjs` |
| **journeys** | `test:e2e:smoke` + `test:e2e:a11y` (Playwright; starts candidate app unless `PLAYWRIGHT_BASE_URL` set). Sets `PLAYWRIGHT_RELEASE_GATE=true` when full gate |

Also writes candidate evidence fingerprint; integrity failure marks gate failed.

**Quality aliases:** `quality:static|contracts|content|security|commerce|journeys|production` → same script with `--group`.

### Does release-gate nest builds/tests?

**Yes.**

- **Build:** once inside `production` group (`npm run build`).
- **Unit/integration tests:** full `npm test` in `contracts`, plus a second commerce-focused vitest invocation.
- **E2E:** smoke + a11y inside `journeys`.
- **CI after gate:** another full Lighthouse phase-2 (manages its own server) and soft UX audit — **additional** to nested journeys.

So a green PR currently pays: full release-gate (tsc+lint+vitest+content+rls+**production build**+playwright smoke/a11y) **plus** blocking Lighthouse budgets.

---

## 3. Fast PR vs full gate (without weakening evidence)

Goal: shorter PR feedback **without** deleting proof — move heavy evidence to `main` / labeled / nightly, keep same artifacts for release.

### Keep on every PR (fast evidence core)

Equivalent to `quality:static` + `quality:contracts` (+ maybe `quality:commerce` subset):

- validate-build-mode / secrets / deps policy
- tsc + lint + inventory:check
- full `npm test` (or contracts + commerce vitest files)
- redirect / manual / rich content `:check` if content-touched (path filters)

This preserves compile + contract + booking integrity signal without waiting on build+LH+e2e.

### Move to `main` / release / optional workflow (retain evidence)

| Check | Why safe to defer on PR |
|-------|-------------------------|
| `production` group (`npm run build` + artifact scan) | Still required before merge to main / promotion; PR can use Vercel preview build as parallel signal if trusted |
| `journeys` (Playwright smoke + a11y) | Keep on main + `production-acceptance`; optional `workflow_dispatch` / path filter for UI |
| CI Lighthouse phase-2 (3 runs) | Already post-gate; heaviest wall-clock; keep blocking on main |
| Soft UX audit | Already non-blocking — drop from PR or nightly |
| Content python provenance + editorial + media integrity | Path-filter: only when `content/`, `public/`, media, or blog scripts change |
| `seo-audit` | Already non-blocking inside gate |

### Suggested split (proposal only — not implemented)

1. **PR job `verify-fast`:** `npm run quality:static && npm run quality:contracts && npm run quality:commerce` (+ security if secrets present / always rls-audit if local DB not required).
2. **PR job `verify-full` (optional):** `release:gate` when label `full-gate` or changes to `src/app/**`, `middleware`, commerce.
3. **`main` push:** keep current `verify` (full `release:gate` + LH) + `production-acceptance`.

Evidence continuity:

- Same `var/ops/release-gate-report.json` schema on full runs
- Fast PRs still upload tsc/lint/test logs or a slim report
- Do **not** remove production-acceptance SHA wait + smoke on main

### Anti-patterns to avoid

- Making Lighthouse or e2e `continue-on-error` on main (weakens release evidence)
- Dropping `inventory:check` or secrets audit from PR (cheap, high value)
- Replacing release-gate build with “Vercel succeeded” without same env/`NEXT_PUBLIC_ENABLE_DEMO_SEED=false` contract
- Skipping commerce integrity tests on booking/payment PRs

---

## 4. Related workflows (out of PR verify)

| Workflow | Role |
|----------|------|
| `staging-acceptance.yml` | Staging harness |
| `supabase-logical-backup.yml` | Backup cron |
| `ingestion-dispatch.yml` | Ingestion |

Not nested inside `ci.yml` `verify`, but part of ops surface area.

---

## 5. Cross-links

- Flags / scripts / dormant modules / apartmentsMode: `FLAGS_AND_COMMANDS_DRAFT.md`
- Surface counts: `BEFORE_METRICS.json`
