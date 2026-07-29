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

- Decision: retain `docs/release-2026-07/*inventory*` as historical evidence; use generated `docs/audit/*inventory*` as current source snapshot.
- Reason: current tree has 157 pages and 312 route handlers; historical inventory recorded only 129 pages and 234 handlers.

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

## D-015 — Static product-surface evidence is reproducible but not live proof

- Date: 2026-07-29
- Decision: generate route, data-edge and interaction inventories from AST/import facts; label them `static_source`/`source_only` and keep runtime database state explicitly unknown.
- Evidence: historical CSV missed 28 current pages and 78 current route handlers. WP-005 produces 471 route records, 470 route/data records and 2 298 unique source-line interactions; `inventory:check` is blocking in local and CI gates.
- Consequence: current architecture drift becomes detectable without calling secrets or external services. No table candidate, access signal or UI handler may be cited as proof of live schema, RLS, authorization, backend effect or test coverage.

## D-016 — Critical evidence layers are explicit and monotonic

- Date: 2026-07-29
- Decision: maintain a reviewed critical-journey manifest and generate the evidence ledger only after validating UI dependency reachability, request method/endpoint, route export and exact test title. Keep `unit_contract`, `route_integration`, `browser` and `remote_preview` as separate layers; never infer a higher layer.
- Evidence: WP-006 maps 11 P0/P1 journeys; 8 have source-bound unit contracts and 3 privacy journeys remain `source_only`. Every production status remains `unknown_db_down`.
- Consequence: existing contract tests become discoverable without being overstated. WP-007 addresses privacy transition atomicity and route contracts; real payment, refund, payout or deletion operations remain prohibited during evidence collection.

## D-017 — Approval changes queue state; the processor owns deletion

- Date: 2026-07-29
- Decision: admin privacy approval/rejection may mutate only an eligible request row using compare-and-set. Approval persists actor metadata but does not mutate the profile; the deletion processor exclusively owns the later auth ban, profile anonymization and related-data operations after claiming `approved → processing`.
- Evidence: the previous route allowed reject from `processing`, matched update only by ID and set `profiles.deleted_at` before the processor. Route tests now prove forbidden active-state transitions, CAS conflict 409 and absence of profile mutation.
- Consequence: concurrent admin/cron actions cannot silently overwrite request state at the route boundary. DB-level unique active requests, atomic audit and multi-step processor recovery remain open until canonical migration parity permits a safe database design.

## D-018 — Retry identity comes from the request after profile anonymization

- Date: 2026-07-29
- Decision: resolve deletion identity from the current profile while it is intact; if a partial prior run already removed the profile email, fall back to the privacy-request metadata retained until terminal completion.
- Evidence: the processor anonymizes the profile before deleting all email-linked rows and clearing outbox entries. A later failure therefore made a retry reread `null` email even though the approved request still retained the original email/fullName. Unit tests cover the partial and normal branches and confirm completed metadata contains no PII.
- Consequence: retries can continue deterministic email-linked cleanup after partial profile anonymization. This does not make auth/database mutations atomic, guarantee one active request, or prove live deletion; WP-009 and later DB parity work retain those gates.

## D-019 — Terminal deletion state is monotonic; notification is best-effort

- Date: 2026-07-29
- Decision: guard both completion and failure writes with current `processing` status, and run completion notification outside the destructive failure boundary. Do not automatically requeue `failed` requests.
- Evidence: previously an email-provider exception after `completed` entered the catch and wrote `failed` by ID. New contracts prove destructive failure invokes failure marking once, lost processing CAS is surfaced without overwrite, and notification failure returns successful completion without calling failure marking.
- Consequence: a non-critical notification cannot regress an irreversible completed deletion, and concurrent status changes remain monotonic. Manual admin re-approval remains the controlled retry path; automatic retry requires later lease/backoff/dead-letter and DB evidence.

## D-020 — A payment link claims one online provider before checkout creation

- Date: 2026-07-29
- Decision: use the existing booking `updated_at` compare-and-set to claim Stripe or Mercado Pago before any external call; never release the provider automatically after an ambiguous network failure. Persist the provider result through a second CAS and keep same-provider idempotent retry.
- Evidence: the former routes could concurrently create different provider checkouts and blind-write stale booking snapshots. Route integration with a shared fake atomic store proves two parallel App Router handlers produce statuses 200/409 and exactly one provider call; webhook interleaving remains paid and returns 409.
- Consequence: a single capability token cannot expose two checkout URLs or overwrite newer payment state. Switching provider requires a separately controlled recovery/new-link decision; live effect proof remains blocked by the unhealthy data plane.

## D-021 — Payment capability responses are explicit projections

- Date: 2026-07-29
- Decision: the payment-link status route returns only fields rendered by checkout/result pages and public-safe errors. It may not serialize a canonical CRM booking.
- Evidence: local production smoke reproduced raw `supabaseKey is required`; source review showed the response also included travelers/passports, phone, CRM comments, owner IDs and private metadata. Route tests assert the bounded projection and absence of these fields.
- Consequence: possession of a payment token grants the payment UI capability, not general CRM data access. Receipt/live DB behavior is still unproven while Supabase is unavailable.

## D-022 — Exact-SHA evidence includes the build output directory

- Date: 2026-07-29
- Decision: bind local production evidence to source SHA, runtime behavior and the explicit build/start distDir. Reject a health SHA supplied only by runtime env when behavior belongs to an older bundle.
- Evidence: importing Vercel env made Next build use `.next`, while local start used an old `.next-production`; smoke still observed the pre-fix raw error. Rebuilding `179d3e51` with `NEXT_DIST_DIR=.next-production` changed the endpoint to the expected public-safe 503.
- Consequence: the rejected run is not counted. Future packets must record distDir or use one command that builds and starts the same artifact.

## D-023 — Quote intent never owns inventory

- Date: 2026-07-29
- Decision: derive `reservationSlotDate` exclusively from the server-owned canonical booking intent and product schedule. A `price_quote` or custom-date lead may persist, but it never reserves an availability slot.
- Evidence: the former route unconditionally passed the selected date to `ensureAvailabilitySlotForBooking` and the atomic RPC; `priceQuoteRequest: true` therefore advanced `booked_count`. Route integration now proves quote persistence with zero reservation calls.
- Consequence: inventory represents bookable commitments rather than pricing leads. Live RPC behavior remains unproven until the canonical data plane is restored.

## D-024 — Required booking availability fails closed before persistence

- Date: 2026-07-29
- Decision: when a canonical scheduled booking requires a slot, inability to bootstrap/confirm that slot returns public-safe 409 before the atomic booking command. The route may not rely on an absent availability row being tolerated downstream.
- Evidence: `ensureAvailabilitySlotForBooking` already returned false on lookup/bootstrap failure, but the handler ignored it and the RPC proceeded when the requested row was absent. Route tests assert zero persistence/reservation/notification effects on this branch and 409 for an atomic slot conflict.
- Consequence: degraded dependencies cannot create a scheduled booking without capacity validation. This is deliberately stricter than accepting a lead as a confirmed booking.

## D-025 — Booking dependency details are internal telemetry only

- Date: 2026-07-29
- Decision: known command validation may keep explicit public status/codes; unknown storage/RPC/config failures are captured internally and returned as a generic 503 without raw detail.
- Evidence: the atomic wrapper previously returned arbitrary RPC error messages through the public route. The App Router test injects a database message containing a secret marker, asserts that Sentry receives it and the response does not.
- Consequence: public booking failures remain actionable without disclosing SQL, schema or configuration details.

## D-026 — Webhook 2xx requires a durable charge ledger

- Date: 2026-07-29
- Decision: a verified payment webhook is not successfully processed merely because the booking state CAS applied. The route may acknowledge 2xx only after the corresponding charge ledger write is durable or an exact replay has idempotently repaired it; notification is emitted only for the first applied event after that boundary.
- Evidence: both provider routes patch booking first, while the ledger helper catches all failures. The route then returns 200 and the processed event ID prevents the provider retry from attempting ledger persistence again.
- Consequence: implemented in WP-012 `77cf5674`; live provider, Data API/RLS, commission and outbox proof remains gated by P0 infrastructure recovery.

## D-027 — Exact webhook replay is a repair capability

- Date: 2026-07-29
- Decision: retain the processed event ID as the booking-state idempotency boundary, but classify an exact replay separately from a state duplicate. Both a first application and exact replay must attempt the same durable charge persistence; only an inserted first charge may trigger recovery notification.
- Evidence: the previous boolean helper returned false for both rejection and replay, so a provider retry after ledger failure could not distinguish safe rejection from repair. Signed route tests prove `500 → exact replay → inserted ledger → 200` and one notification; concurrent replay with an existing row does not duplicate notification.
- Consequence: booking state remains monotonic while the financial ledger becomes self-repairing under provider retry. Notification delivery itself is still best-effort and requires later outbox evidence.

## D-028 — Provider notification identity and payment identity are separate

- Date: 2026-07-29
- Decision: Mercado Pago booking idempotency uses the durable webhook notification ID; charge uniqueness uses payment resource ID. If notification ID is absent, reject before provider fetch or database access instead of deriving an event ID from the payment ID.
- Evidence: pending and paid notifications for one payment share `data.id` but have distinct notification `id`. The former fallback `mp-payment-${payment.id}` collapsed lifecycle updates into one replay identity. Signed tests assert distinct source event IDs and zero provider/DB calls when notification identity is absent.
- Consequence: payment lifecycle events can progress independently without weakening charge-row uniqueness.

## D-029 — Use the existing partial uniqueness boundary before unverified DDL

- Date: 2026-07-29
- Decision: charge persistence inserts first, treats SQLSTATE `23505` as the concurrency signal, then reads the exact `(provider, external_id)` row and updates only if booking ownership and monotonic state permit. Do not add a new migration while the 107-file live journal is unavailable.
- Evidence: the repository already contains a partial unique index for non-null provider/external ID. Fake-store concurrency produces one row; cross-booking reuse is rejected; delayed paid cannot regress a refunded row.
- Consequence: candidate removes the application read→insert race without claiming live PostgREST/RLS/index parity. That behavior must be re-run against the canonical data plane after recovery.
