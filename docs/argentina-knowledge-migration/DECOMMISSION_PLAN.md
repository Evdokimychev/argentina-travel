# Decommission Plan

Status: `BLOCKED EXTERNALLY` until production shadow/cutover verification.

After two successful primary cycles:

1. Confirm no cron, process, webhook, launch agent or operator runbook invokes the Collector path.
2. Preserve Git history and create a final encrypted archive of config, raw, knowledge, media, reports and checksum manifest.
3. Replace the old README with an archived/read-only notice pointing to Argentina Travel admin and this dossier.
4. Remove the old project from deployment and operational documentation; it currently has no independent deployment/cron.
5. Revoke `ARGENTINA_TRAVEL_API_KEY`; retain Telegram rollback credentials for the approved 14-day window only.
6. After retention, remove the old local session file and rotate/revoke credentials no longer needed.
7. Mark the repository read-only/archived. Do not delete Git history or backup.

Do not perform these actions from code completion alone. Record cutover time, backup location, operator and verification evidence in `FINAL_REPORT.md` first.
