# Sprint 5 — Canonical commercial landings

Выбор по фактическому состоянию продукта (Content OS + marketplace), без doorway-дублей.

| Intent | Canonical path | Role | Inventory CTA | Notes |
|---|---|---|---|---|
| Buenos Aires | `/guide/buenos-aires` (или актуальный pillar slug) | Destination pillar + commercial embeds | Tours/excursions related | Один intent = одна страница |
| Iguazú | `/guide/iguazu` | Destination pillar | Related tours when fresh | Не плодить `/iguazu-tours` |
| Patagonia | `/guide/patagonia` | Destination pillar | Strong editorial + catalog | Performance hotspot historically |
| El Calafate | destination/guide canonical | Glacier intent | Inventory-gated CTA | Degrade CTA if stale |
| Ushuaia | destination/guide canonical | End-of-world intent | Inventory-gated CTA | |
| Mendoza | destination/guide canonical | Wine / Andes | Inventory-gated CTA | |

Правила:

1. Commercial recommendation только при релевантном inventory (Sprint 2 freshness).
2. Guide без offers остаётся travel guide; CTA честно деградирует.
3. Analytics placement ids стабильны (`destination_embed`, `related_tours`, `map_tour_list`) — не текст кнопки.
4. Paid traffic не направлять на landing без working next step + tracking.
