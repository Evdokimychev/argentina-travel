# CI Evidence Integrity — Iteration 7

## Remaining defect after I6

I6 SHA-bound release-gate artifacts correctly.

Performance upload still used:

```yaml
path: |
  var/ops/lighthouse-phase2-sample-last.json
  var/ops/lh-*.json
if: always()
```

If build failed before Lighthouse, historical `*-last.json` could still be uploaded under the current SHA.

## Fix

1. `scripts/stage-performance-artifact.mjs --prepare` clears stale LH files before the gate.
2. `--stage` copies only current-run files into `var/ops/ci/<runId>/<sha>/performance/`.
3. If nothing was generated → `CURRENT_RUN_NOT_EXECUTED` marker.
4. CI upload path is only the run-scoped directory.
5. Contract test updated: forbids raw `lighthouse-phase2-sample-last.json` upload.

## Redirect path validation

Added `scripts/lib/redirect-path-patterns.test.mjs` to fail CI if glued `:path*` patterns reappear.
