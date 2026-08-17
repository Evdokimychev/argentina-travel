# SECURITY — GoArgentina / «Пора в Аргентину»

Supported security invariants for humans and AI agents working on this repository.

## Never weaken

- Do not disable RLS, skip high-risk auth tests, or turn security failures into warnings to get green CI.
- Do not print secrets, tokens, cookies, or live credentials in logs, commits, PRs, or reports.
- Do not force-push `main`.
- Do not treat synthetic/unit evidence as live production proof.
- Do not replace live evidence with invented PASS.

## Authorization

- UI visibility is never authorization.
- Admin APIs require server-side session + capability checks (`authorizeAdminRequest`).
- Organizer mutations must enforce ownership server-side; never trust client `organizerId`.
- Blocked users must not obtain API sessions (`loadSessionUserFromSupabase` returns null).

## Machine credentials

- `SUPABASE_SERVICE_ROLE_KEY` is for server→DB only.
- It is **not** a general HTTP admin Bearer password.
- Automation over HTTP must use `ADMIN_AUTOMATION_SECRET` (or cron `CRON_SECRET`).
- Temporary escape hatch: `ALLOW_SERVICE_ROLE_ADMIN_BEARER=1` only during rotation.

## High-risk mutations

When Upstash is configured, security-critical rate limits **fail closed** on Redis outage
(`checkSecurityRateLimit` / `policy: "security_critical"`). Normal reads may degrade.

## Audit

- Best-effort audit is allowed for low-risk actions.
- Critical security/payment/privacy/staff actions must use durable audit semantics
  (`writeCriticalAdminAuditLog`) and must not silently succeed if the journal write fails.

## Database / recovery

- Destructive scripts must attest canonical DB target and fail closed on mismatch/unknown.
- A backup script ≠ a successful backup; a dump ≠ a successful restore.
- Live RLS evidence is required separately from static migration analysis.

## Reporting

Report suspected vulnerabilities privately to the project owner. Do not open public issues
with exploit details or secrets.
