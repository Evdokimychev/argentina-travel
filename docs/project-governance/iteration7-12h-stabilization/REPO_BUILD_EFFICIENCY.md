# Repo / Build Efficiency — Iteration 7

## Findings

| Item | Evidence |
|------|----------|
| Working tree without node_modules | multi-GB |
| `research/third-party` | ~996 MB, 861 tracked files (full-page PNGs up to ~50 MB) |
| Largest blobs | YouTravel capture full-page screenshots + oversized blog media |
| Docs claimed research was ignored | false — not in `.gitignore` |

## Actions (no history rewrite)

1. `git rm --cached -r research/third-party` — removed from current tree.
2. `.gitignore` → `/research/third-party/`
3. `.vercelignore` → `research` (shrinks Vercel upload context)
4. `research/README.md` explains local-only captures
5. Regression: `repo-efficiency-guards.test.ts`

History still contains blobs (no filter-repo / force-push). Future HEAD clones / Vercel builds no longer need the dumps in the working tree/context.

## Media note

`public/media` still contains very large JPEGs (e.g. `national-parks.jpg` ~35 MB). CDN migration is post-launch debt; not blindly moved this iteration.
