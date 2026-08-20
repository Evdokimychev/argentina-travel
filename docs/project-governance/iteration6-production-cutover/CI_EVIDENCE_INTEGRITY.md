# CI Evidence Integrity — Iteration 6

## Defect (independent audit)

Workflow uploaded `var/ops/release-gate-*-last.json` via `upload-artifact` with `if: always()`. When a gate aborted before generating fresh evidence (Playwright hang), historical PASS files from the worktree were packaged as artifacts for the **current** SHA.

## Root cause

1. `upload-artifact` glob included repository/worktree paths not bound to the current run.
2. No pre-upload validation of `commitSha == GITHUB_SHA`.
3. No cleanup of stale `*-last.json` before gate execution.

## Fix

| Component | Change |
|-----------|--------|
| `scripts/prepare-release-gate-evidence.mjs` | wipes stale `release-gate-report.json`, `release-gate-*-last.json`, logs |
| `scripts/release-gate.mjs` | cleans at start; report schema v4 adds `ciRunId`, `generatedAt`, `evidenceLevel` |
| `scripts/lib/release-gate-artifact.mjs` | run-scoped staging under `var/ops/ci/<runId>/<sha>/`; SHA/run validation |
| `scripts/stage-release-gate-artifact.mjs` | fails upload prep on SHA mismatch; writes `CURRENT_RUN_NOT_EXECUTED` if gate skipped |
| `.github/workflows/ci.yml` | uploads only staged CI dir; Playwright without `--with-deps` + timeout |
| `scripts/lib/release-gate-artifact.test.mjs` | regression: stale `*-last.json` cannot pass as current evidence |

## Evidence contract

Each staged artifact manifest includes:

```json
{
  "commitSha": "<GITHUB_SHA>",
  "runId": "<GITHUB_RUN_ID>",
  "generatedAt": "<ISO>",
  "status": "passed|failed|CURRENT_RUN_NOT_EXECUTED"
}
```

Validation rejects `commit-sha-mismatch` and `run-id-mismatch`.

## Local proof

- `node --test scripts/lib/release-gate-artifact.test.mjs` — 4/4 PASS
- Included in release gate static contracts bundle
