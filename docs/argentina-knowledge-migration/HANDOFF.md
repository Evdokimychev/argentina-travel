# Handoff

## Current objective

Move the complete operational ingestion lifecycle into Argentina Travel and remove the old Collector as a runtime dependency.

## Safety

- Do not revert unrelated dirty files on branch `codex/sprint-0-release-candidate`.
- Do not modify `.env.local` or reveal values.
- Do not disable production jobs before shadow verification.
- Do not publish imported candidates automatically.

## Baseline

`npm run audit:quick` passes with 1850 tests. Collector inventory: 1 active source, 69 raw files, 24 article records, 24 Markdown files, 2 reports.
