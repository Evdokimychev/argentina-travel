# Legacy blog override inventory (Sprint 3)

Generated as part of Content OS consolidation.  
Canonical policy: `CONTENT_OWNERSHIP_CONTRACT.md`.

## Goal

Invisible third-layer edits must not remain the long-term SSOT.

| Override map | Approx. size | Action | Notes |
|--------------|-------------:|--------|-------|
| `legacyManualBlogPosts` in `src/data/blog.ts` | large inline corpus | MIGRATE | Move to MD/typed modules via existing sync pipelines; keep URL/slug |
| `legacyManualOfficialSources` | ~8 slugs | MIGRATE | Fold into article `sources` / KB claims |
| `legacyManualExcerptOverrides` | ~2 slugs | MIGRATE | Fold into post excerpt in canonical doc |
| `legacyManualReplacementSections` | few slugs | MIGRATE then REMOVE | Temporary body patches |
| `legacyManualSectionOverrides` | ~5 slugs | MIGRATE then REMOVE | Prefer typed blocks / CMS body |
| `legacyManualRemovedSections` | ~2 slugs | KEEP TEMPORARILY | Explicit removals until source cleaned |
| `EDITORIAL_OVERRIDES` (`src/data/blog-editorial`) | ~1 | MIGRATE | Typed polish → document blocks |

## Precedence reminder

File blog assembly + CMS merge (`blog-resolver`) owns publication.  
Overrides are compatibility only — do not add new override maps.

## Dual block system

- Canonical: `BlogBodyBlock`
- Legacy bridge: `adaptRichBlockToBody` / `adaptRichBlocksToBody`
- Deprecate Rich-only public renderers only when usage = 0 and visual QA passes

## Commands

```bash
npm run content:source-matrix
npm run content:quality
npm run sync-rich-articles:check
npm run sync-manual-posts:check
npm run editorial:audit
```
