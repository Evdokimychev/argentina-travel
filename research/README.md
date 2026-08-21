# Research captures

Competitor screenshot dumps under `third-party/` are **local-only**.

They must not be committed: they historically inflated the repository by ~1 GiB
and are not needed for build, CI, or production.

Re-capture with `tools/capture-references.mjs` when needed for design work.
