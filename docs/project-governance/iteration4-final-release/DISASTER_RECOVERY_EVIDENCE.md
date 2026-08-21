# Disaster recovery evidence — Iteration 4

## Backup

| Item | Result |
|------|--------|
| Workflow | `.github/workflows/supabase-logical-backup.yml` daily 03:30 ART |
| Last run | 2026-08-18T07:12Z, SHA `81055b13`, **failure** |
| Failure reason | `BACKUP_DATABASE_URL` / `BACKUP_AGE_RECIPIENT` / `BACKUP_SOURCE_PROJECT_REF` empty |
| Managed PITR | Unconfirmed on Free plan |
| Integrity artifact | None produced |

This is not “backup exists.” The job ran and could not dump.

## Restore rehearsal

```
npm run backup:restore:preflight
→ [restore-verification] BACKUP_MANIFEST_PATH is required
```

No disposable target, no encrypted dump, no application smoke against a
restored database. Production ref `uooxrypocahomoqzdvzy` remains hard-denied
as a restore target.

## RTO / RPO (realistic, not enterprise theatre)

| Question | Honest answer |
|----------|----------------|
| What can be lost? | Any Data API / booking / CMS / CRM writes since the last **successful** encrypted dump. Today that last dump does not exist in GitHub artifacts. |
| How fast to recover? | Only after owner creates a disposable project, provides age identity + backup URL, and runs the documented rehearsal. Hours, not minutes, and only if a dump exists. |
| App rollback | Redeploy previous Vercel production SHA (`81055b13` is current). Impossible for I4 until account is unblocked. |
| Bad migration | Expand/contract: new grants file is restatement. I3 application lock is revoke-only. Live apply still BLOCKED. If a future migration is incompatible, restore from dump — which is currently missing. |

## Rollback

| Failure | Path |
|---------|------|
| Bad app deploy | Vercel rollback to last good production deployment (`5949169997`, SHA `81055b13`) |
| Bad DB migration | Do not `down` blindly. Restore disposable, then decide. Production restore forbidden without explicit owner action |

App rollback ≠ database rollback.

## Classification

**FAIL** for launch proof. **BLOCKED_EXTERNAL** for owner secrets / disposable
project / PITR confirmation. Agent cannot rotate GitHub environment secrets.
