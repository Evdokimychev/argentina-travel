# План миграции редакционной системы

## Этап 1 — Registry и обёртки (сделано)

- `src/editorial/registry` с метаданными блоков
- `renderEditorialBlock` поверх `BlogSectionBody`
- Preview `/admin/editorial-components`
- `npm run editorial:audit`

## Этап 2 — Adapters и schemas (сделано)

- Legacy `infobox` → `callout`
- Optional `media` → `photo`
- Rich → body bridge (`adaptRichBlockToBody`)
- Validation helpers (Zod-ready) + CMS normalize для новых типов
- Page builder picker/fields для новых блоков

## Этап 3 — Миграция статей партиями

Пилоты (typed-blocks, без ломания prose):

1. `argentinian-steak-guide` — summary, option-selector, comparison, phrasebook, country-tip, sources, CTA
2. `best-time-to-visit-argentina` — season-matrix + summary + comparison + pros-cons
3. `dni-cuil-argentina` — option-selector + steps + sources (миграционный кейс)

Далее: самые посещаемые → cornerstone → legacy overrides.

## Этап 4 — Удаление deprecated

Удалять `infobox` / дублирующие rich-only рендеры только после:

- `npm run editorial:audit -- --strict` без usages
- проверки CMS records
- visual QA light/dark + mobile

## Precedence

parser(`section.body`) → `section.blocks` → `getTypedBlocksForSection` → CMS merge → legacy section overrides
