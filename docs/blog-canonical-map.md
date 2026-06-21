# Карта canonical-пар блога

> **Дата:** 21 июня 2026  
> **Спринт:** 1–2 (фундамент качества + editorial overrides)  
> **Источник в коде:** `src/data/blog-canonical-map.ts`

Шаблонные статьи Класса B (`noIndex: true`) не конкурируют с pillar-материалами: в metadata выставляется `rel=canonical` на канонический slug, в тексте — явный CTA.

## Таблица пар

| Шаблон (noindex) | Каноническая статья (index) | Реализация |
|------------------|-------------------------------|------------|
| `food-asado` | `argentinian-steak-guide` | exact + CTA в «Кратко» |
| `ba-district-palermo` (+ `recoleta`, `san-telmo`, `microcentro`, `puerto-madero`) | `buenos-aires-neighborhoods` | prefix `ba-district-*` |
| `wine-malbec` | `food-malbec` | exact + CTA *(Sprint 2: микродубликаты вин/кухни)* |
| `relocation-visa-free` | `argentina-tourist-visa-2026` | exact + CTA |
| `trekking-чек-лист` | `patagonia-packing-list` | exact + CTA |

### Сняты с canonical (Sprint 2)

| Бывший шаблон | Статус |
|---------------|--------|
| `patagonia-за-14-дней` | `patagoniya-marshrut-14-dney` | exact + CTA *(Sprint 3)* |
| `northwest-*` (20 шаблонов) | `salta-i-severo-zapad-marshrut` | prefix `northwest-*` *(Sprint 3)* |

## Техника

- Поле `BlogPost.canonicalSlug` — slug канонической статьи.
- `generateMetadata` на `/blog/[slug]`: `alternates.canonical` → `/blog/{canonicalSlug}` для пар.
- Баннер на странице шаблона (`BlogPostView`) со ссылкой на канон.
- JSON-LD `Article` не выводится для Класса B (как и раньше).

## Backlog (не в Sprint 1–2)

| Пара | Заметка |
|------|---------|
| `food-malbec` + `wine-malbec` | Полное слияние в одну pillar «Мальбек: от винодельни до бокала» — Sprint 3+ / винная серия |
| 301-редиректы кириллических slug | P2, когда появится трафик |
