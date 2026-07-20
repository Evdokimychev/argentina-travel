# Decommission Plan

Status: `DONE` on 2026-07-20.

## Evidence already complete

- No active process, cron, launch agent, webhook or independent deployment references the old Collector.
- Full encrypted archive: 44,452,648 bytes, 8,104 entries.
- Archive SHA-256: `05e228717e9c1483e169cf4ec05cf82eecb8dff0868d1a629fe5cbf10298bbd6`.
- Archive listing proves `.git`, `.env`, `database/sessions/main.session`, code and all data are present.
- Production target no longer uses a bridge, exported package or old filesystem.

## Final state

`collector.py` exits with an archived-project notice and `DECOMMISSIONED.md` points operators to `/admin/ingestion`. The tombstone was executed and verified to exit non-zero without importing legacy code. The local plaintext session remains only for the 14-day rollback window; the active credential is the encrypted Vercel StringSession. After 2026-08-03 the local plaintext secret/session may be removed after a fresh target backup.
