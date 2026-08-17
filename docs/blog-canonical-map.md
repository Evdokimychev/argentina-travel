# Карта canonical-пар блога

> **Дата:** 17 августа 2026  
> **Спринт:** 3 (Content OS)  
> **Источник в коде:** `src/data/blog-canonical-map.ts`

Шаблонные статьи Класса B (`noIndex: true`) не конкурируют с pillar-материалами: в metadata выставляется `rel=canonical` на канонический slug, в тексте — явный CTA.

Правило Content OS: editorial override `publicationReady: true` **не** отменяет canonical map. Если slug попал в exact/prefix map, пост остаётся noindex + `canonicalSlug`.

## Таблица пар

| Шаблон (noindex) | Каноническая статья (index) | Реализация |
|------------------|-------------------------------|------------|
| `food-asado` | `argentinian-steak-guide` | exact + CTA |
| `ba-district-*` | `buenos-aires-rajony` | prefix |
| `wine-malbec` | `food-malbec` | exact + CTA |
| `relocation-visa-free` | `argentina-tourist-visa-2026` | exact + CTA |
| `trekking-чек-лист` | `patagonia-packing-list` | exact + CTA |
| `patagonia-чек-лист` | `patagonia-packing-list` | exact + CTA |
| `patagonia-за-*` (в т.ч. 3/5/7/10/14 дней) | `patagoniya-marshrut-14-dney` | prefix (+ exact для 14 дней) |
| `northwest-*` | `salta-i-severo-zapad-marshrut` | prefix |

## Техника

- Поле `BlogPost.canonicalSlug` — slug канонической статьи.
- `generateBlogPostFromPlan` применяет map и для шаблонов без override, и для editorial override.
- `generateMetadata` на `/blog/[slug]`: `alternates.canonical` → `/blog/{canonicalSlug}` для пар.
- Баннер на странице шаблона (`BlogPostView`) со ссылкой на канон.
- JSON-LD `Article` не выводится для Класса B (как и раньше).

## Backlog

| Пара | Заметка |
|------|---------|
| `food-malbec` + `wine-malbec` | Полное слияние в одну pillar «Мальбек: от винодельни до бокала» |
| 301-редиректы кириллических slug | P2, когда появится трафик |
