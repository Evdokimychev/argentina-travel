# Decommission Plan

- Stop old cron/workers/webhooks if any are discovered (none in current repository baseline).
- Remove old Collector from operational runbooks and machines after shadow verification.
- Revoke `ARGENTINA_TRAVEL_API_KEY` used by the transitional bridge.
- Retain encrypted `.env`/Telegram session only for the rollback window, then revoke/remove it.
- Create final filesystem and Git backup; do not delete Git history.
- Replace old README with archived/read-only notice and pointer to Argentina Travel.
- Confirm no process, deployment, API call or schedule depends on the old path.
- Archive repository only after production owner signs off.
