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

## D-009 — Public commercial claims must be capability- and source-specific

- Date: 2026-07-29
- Decision: global copy may promise only behavior proven across the product. Booking, payment, cancellation, review and organizer claims must identify whether GoArgentina or a named partner owns the action.
- Evidence: current catalog mixes internal request and partner handoff flows; no end-to-end proof supports blanket marketplace, verified-organizer, real-review or no-prepayment claims.
- Consequence: WP-002 qualifies footer/hero/about/navigation/guide/marketplace copy and adds locale/source contract tests.

## D-010 — A successful local build is not a Vercel preview

- Date: 2026-07-29
- Decision: record deployment ID only when Vercel created one for the exact SHA; never reuse an earlier deployment as proof for a later commit.
- Evidence: `4c209069` deployed successfully as `D9WetK9zSgNuom1ytiAUYmmLfsne`, but `ef447d8e` was rejected with `Account is blocked` and has no deployment ID.
- Consequence: WP-002 final candidate remains remote-preview-blocked despite local production-equivalent QA.

## D-011 — Release candidate must be rooted in current `origin/main`

- Date: 2026-07-29
- Decision: preserve the dirty user worktree and create `codex/master-goal-release-candidate` from `origin/main`, applying only the six proven governance/WP commits.
- Evidence: all cherry-picks completed without conflicts; `origin/main` is ancestor of `a07327db`; worktree and diff checks are clean; 54 focused/evidence tests, TypeScript and lint pass.
- Consequence: P1-GA-009 is resolved for the candidate branch, while production promotion remains gated by Supabase/Vercel P0/P1 evidence.

## D-012 — Optional catalog data cannot block editorial content

- Date: 2026-07-29
- Decision: a guide pillar loads marketplace data only when its content schema contains a configured `tour-embed`; editorial links or partner cards do not create a catalog dependency.
- Evidence: all pillar pages previously called catalog aggregation and N public-detail resolutions; safety had no widget but cold total was 3.797 s and generated deadline/429 logs. After `b53daadd`, it renders in 0.399 s without marketplace logs.
- Consequence: editorial content remains available during catalog incidents, while the real tour widget retains strict detail validation and is handled as a separate optional streaming boundary.

## D-013 — Optional widget failure and confirmed empty are different states

- Date: 2026-07-29
- Decision: pass optional catalog work as a promise into a local Suspense boundary; expose a strict public-detail filter that throws only when zero cards resolve and at least one candidate is operationally unavailable.
- Evidence: the first browser pass showed that the existing filter silently converted unavailable detail results into `[]`. Fault injection now proves confirmed missing → `ok + []` and outage → typed `unavailable`; exact `189684fa` browser QA shows the parent guide during the pending state and no uncaught RSC error under live quota/429 degradation.
- Consequence: editorial content never inherits the optional widget's failure UI. A partially available catalog may omit an unmatched optional offer, but cannot claim that the whole catalog is empty.

## D-014 — A recovered preview does not authorize promotion

- Date: 2026-07-29
- Decision: accept `189684fa` / `NnmUYR17cEok1QXihkGjpMEgCqQA` as immutable remote evidence for WP-001/WP-004, but keep release status NOT READY and forbid promotion.
- Evidence: Vercel status is success and preview health binds the full SHA; desktop/mobile QA passes. The same artifact reports health/public/database/partners 503/down, REST and direct PG unavailable, and the official production smoke exits 1 at the health gate.
- Consequence: P1-GA-005 becomes partially resolved (build and browser evidence restored), while P0-GA-001 and runtime-log scope remain release blockers.
