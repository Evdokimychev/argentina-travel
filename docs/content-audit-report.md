# Аудит контента — Пора в Аргентину

> Дата: июнь 2026 (обновлено после Sprint 6). Принцип: **не удалять**, дополнять и связывать.

## Сводка

| Метрика | Значение |
|---------|----------|
| Route templates (`page.tsx`) | 62+ |
| Статических indexable URL | ~130+ |
| Мест в справочнике | 20 |
| Подборок | 12 (4 исходных + 8 новых) |
| Маршрутов | 3 |
| **Статей блога (каталог)** | **271** (19 ручных + rich + 252 plan) |
| **Indexable материалов** | **67** |
| **Noindex (Класс B)** | **204** |
| Editorial overrides | 40 (28 Patagonia + 5 money + 4 BA + 3 Iguazu) |
| Rich-гайды нацпарков | 12+ |
| С tour embeds (indexable) | **≥ 15** |

## Классификация (кратко)

- **COMPLETE:** guide pillars (14), immigration pillars (7), `/guide/ob-argentine`, destinations (8), tours, blog indexable corpus (60)
- **IMPROVE:** `/faq`, `/gallery`; overrides 450–550 слов (расширение до 800 — post-roadmap)
- **OUTDATED:** часть immigration (курс peso и визы — slug обновлены на -2026)
- **DUPLICATE (не удалять):** destinations ↔ places — разные роли; blog ↔ guide — teaser + CTA + canonical

## Реализовано после аудита

1. `src/data/places-enrichment.ts` — history, facts, howToGetThere, FAQ для 20 мест
2. `src/data/knowledge-graph/` — entities + relations
3. `src/lib/knowledge-internal-links.ts` — перелинковка
4. `src/components/knowledge/RelatedKnowledgeSection.tsx`
5. `src/data/blog-content-plan.ts` — 250 пунктов плана
6. 8 новых collections в `places-seed.ts`
7. FAQ JSON-LD на страницах мест и indexable-блога с секцией FAQ
8. Блог: `BLOG_PUBLISH_ALL_PLAN` — все пункты плана в каталоге
9. Редиректы `/blog/*-2025` → `/blog/*-2026` для двух ручных статей
10. **Sprint 6:** фиктивные просмотры заменены на «Обновлено {dateModified}»; tour embeds на ≥ 15 indexable; блок «Похожие статьи»; opt-in «Показать черновики»; `dateModified` на 100 % indexable

## QA-чеклист (Sprint 6)

- [x] `generateStaticParams` — все slug блога (271)
- [x] robots noindex на Классе B
- [x] JSON-LD `Article` + `dateModified` на indexable
- [x] FAQ JSON-LD для секционных статей с FAQ и rich-гидов
- [x] Нет отображения фиктивных просмотров на indexable
- [x] Tour embeds ≥ 15 indexable статей
- [x] 100 % indexable с `dateModified`

## Требует ручной проверки

- Immigration: DNU/RADEX 2025–2026
- Blog: курс peso, визы — актуализировать даты в текстах при изменении правил
- Prisma seed при `PLACES_USE_DB=true` — новые поля enrichment

## Дубликаты — стратегия

| Пара | Действие |
|------|----------|
| destination ↔ place | Разные intent + блок «Связанные материалы» |
| blog ↔ guide pillar | Blog = teaser, canonical на pillar |
| tour iguazu ↔ place iguazu | Бронирование vs справочник |

## Источники (факты, не копирование)

Argentina.travel, parquesnacionales.gob.ar, UNESCO, ru-ar.ru, ruargentina.com — для проверки фактов при редакции.
