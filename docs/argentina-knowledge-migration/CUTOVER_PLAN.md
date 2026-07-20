# Cutover Plan

## Executed

1. Created and validated encrypted production database backup before DDL.
2. Applied two additive migrations through the canonical transaction/checksum runner.
3. Migrated all Collector data and media, then repeated the apply.
4. Verified database counts, ledger groups and private Storage bytes.
5. Installed encrypted Telegram credentials and rotated `CRON_SECRET`.
6. Replaced unsupported Vercel Hobby 15-minute cron with one GitHub Actions dispatcher in this repository.
7. Deployed commit `3dcfa836` as production deployment `dpl_2LwK3EEmVJ6ReQKb5dFwqen1P7zW` and verified schema 105, direct Postgres and route guards.
8. Enabled `telegram:vista_argentina`; the first live run processed 3 items with 0 failures.
9. Forced a second due run; it fetched and created 0 items with checkpoint 785 unchanged.
10. Replaced the legacy entrypoint with a fail-closed notice and retained the encrypted rollback archive.

## Rollback

Disable the migrated source first and stop the GitHub workflow. Preserve current run/checkpoint evidence. The database changes are additive; rollback SQL exists for both 2026-07-20 migrations. Raw rows and private objects are retained. The old Collector may be re-enabled only from the encrypted archive during the 14-day rollback window, and never while the native source is active.

Production backup:
`/Users/Study/.codex/private-archives/argentina-travel/pre-cutover-20260720/database`

Legacy archive:
`/Users/Study/.codex/private-archives/argentina-knowledge-collector/decommission-20260720`
