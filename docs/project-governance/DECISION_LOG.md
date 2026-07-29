# DECISION_LOG

## D-001 — Master Goal V6 is the project constitution

- Date: 2026-07-28
- Decision: use the full 1 960-line V6 document as the primary product/engineering governance source.
- Reason: explicit owner instruction; replaces ambiguous continuous-improvement goal.
- Evidence: `CONSTITUTION.md` source and SHA-256.

## D-002 — Current readiness is NOT READY

- Decision: do not use any READY label while production health is 503/down and P0/P1 evidence is open.
- Consequence: no paid traffic, production promotion or new product feature work.

## D-003 — Production data plane recovery outranks all product work

- Decision: P0-GA-001 is top priority. Historical egress quota is a hypothesis, not the current root cause, because direct Postgres also fails.
- Independent work: continue reversible local fail-closed changes and governance while owner access is missing.

## D-004 — No new migration before live journal parity

- Decision: do not create/apply DDL until the canonical 107-file journal, checksums, RLS and grants are read-only reconciled.
- Reason: production target is inaccessible and health metadata is not database proof.

## D-005 — Operational failure must propagate as unavailable

- Decision: typed result/resolution boundaries; `unavailable → LKG or 503`, `confirmed missing → 404`, `confirmed empty → 200 empty`.
- Reason: live false-empty reproduced on tours and excursions.
- Rollback: revert scoped code packet; no schema/data mutation.

## D-006 — Do not deploy mixed dirty state

- Decision: first isolate WP-001 and prove its exact diff. Preview/deploy only an evidence-stable candidate with immutable SHA.
- Reason: 76 current entries include unrelated owner work.

## D-007 — Existing route inventories are baseline, not current truth

- Decision: retain `docs/release-2026-07/*inventory*` as historical evidence and regenerate after P0 recovery/candidate freeze.
- Reason: current tree has 157 pages and 311 route handlers; historical inventory has 370 total records.

## D-008 — Split REST quota recovery from production direct-PG diagnosis

- Date: 2026-07-29
- Decision: record canonical REST root cause as confirmed `exceed_egress_quota`, but keep production direct-PG as a separate unresolved P0 branch.
- Evidence: production build received the exact quota response; local production `/api/health` reported direct-PG healthy with `tripsterCount=68`, while deployed production reports direct-PG `dependency_unavailable`.
- Consequence: owner removes spend cap/upgrades Supabase; engineering inspects Vercel runtime logs/environment/connection without rotating or editing secrets blindly.
