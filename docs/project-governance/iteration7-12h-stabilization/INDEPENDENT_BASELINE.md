# Iteration 7 — Independent Baseline

Generated: 2026-08-20

## Git / PR reconciliation

| Ref | Value |
|-----|-------|
| `origin/main` | `81055b1387e0062301ca9c0ae7468cbf782e2511` |
| I6 / PR #35 head (pre-I7) | `4d7d72eae77b0e5cfce67274b91dbd0f32ece986` |
| I7 branch | `cursor/iteration7-12h-stabilization-5475` |
| Lineage | main → #30 → #31 → #32 → #33 → #34 → #35 → I7 |
| Unique commits outside cumulative chain | 0 |

## Fresh CI on #35 (before I7)

| Job | Result |
|-----|--------|
| verify-contracts | PASS |
| verify-release | **FAIL** — `TypeError: Can not repeat "path" without a prefix and suffix` during `next build` |
| Playwright install | PASS (I6 hang fix confirmed) |
| seo-live-baseline | sitemap timeout against production |
| Vercel preview check | **FAILURE** (same build error; not “account blocked”) |

## Doc truth drift corrected

Iteration 6 `FINAL_LAUNCH_DECISION.md` listed only external blockers and was written **before** this fresh CI run. Internal build blocker existed in I6 redirect patterns and was missed by I6 final report.

## Production live (reverified)

| Check | Result |
|-------|--------|
| `/api/health` | 503 down, sha `81055b13`, DB false |
| `/sitemap.xml` | hangs / times out (~25s+, 0 bytes in this agent probe) |
| Canonical Supabase | `uooxrypocahomoqzdvzy` — MCP connector does not see project |
| Canonical Vercel team | `go-argentina` — admin connector 403; GitHub deployment status still visible |

## Surface recount (I7)

| Surface | Count |
|---------|-------|
| App Router pages | 159 |
| API route handlers | 309 |
| `/api/admin` | 114 |
| `/api/organizer` | 35 |
| Cron route files | 22 |
| Vercel schedules | 4 |
| Migrations | 111 |
| Env name references | ~267 |
| Local media/content files | ~3522 |
| Hotspots (lines) | OrganizerTourEditorView 2270; PageBuilderBlockFields 1874; ContentDocumentEditorView 1530; bookings-store 1513; AuthModal 1386 |
| Research dumps (pre-cleanup) | ~996 MB tracked under `research/third-party` |
