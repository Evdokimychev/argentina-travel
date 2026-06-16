# Аудит контента — Пора в Аргентину

> Дата: июнь 2026. Принцип: **не удалять**, дополнять и связывать.

## Сводка

| Метрика | Значение |
|---------|----------|
| Route templates (`page.tsx`) | 62 |
| Статических indexable URL | ~130+ |
| Мест в справочнике | 20 |
| Подборок | 12 (4 исходных + 8 новых) |
| Маршрутов | 3 |
| Статей блога (опубликовано) | 984 (8 ручных + 976 из плана) |
| Заготовок блога (plan) | 976 (16 категорий × 61 тема) |

## Классификация (кратко)

- **COMPLETE:** guide pillars (14), immigration pillars (7), `/guide/ob-argentine`, destinations (8), tours
- **IMPROVE:** 20 `/places/*` — обогащены все 20 мест (enrichment)
- **THIN:** `/faq`, `/gallery` (блог массово опубликован — волна 3)
- **OUTDATED:** часть immigration (курс peso и визы — slug обновлены на -2026)
- **DUPLICATE (не удалять):** destinations ↔ places — разные роли; blog ↔ guide — teaser + CTA

## Реализовано после аудита

1. `src/data/places-enrichment.ts` — history, facts, howToGetThere, FAQ для 20 мест
2. `src/data/knowledge-graph/` — entities + relations
3. `src/lib/knowledge-internal-links.ts` — перелинковка
4. `src/components/knowledge/RelatedKnowledgeSection.tsx`
5. `src/data/blog-content-plan.ts` — 976 заготовок
6. 8 новых collections в `places-seed.ts`
7. FAQ JSON-LD на страницах мест с FAQ
8. Блог волна 3: `BLOG_PUBLISH_ALL_PLAN` — все пункты плана, кроме ручных slug
9. Редиректы `/blog/*-2025` → `/blog/*-2026` для двух ручных статей

## Требует ручной проверки

- Immigration: DNU/RADEX 2025–2026
- Blog: курс peso, визы — актуализировать даты в текстах
- Prisma seed при `PLACES_USE_DB=true` — новые поля enrichment

## Дубликаты — стратегия

| Пара | Действие |
|------|----------|
| destination ↔ place | Разные intent + блок «Связанные материалы» |
| blog ↔ guide pillar | Blog = teaser, canonical на pillar |
| tour iguazu ↔ place iguazu | Бронирование vs справочник |

## Источники (факты, не копирование)

Argentina.travel, parquesnacionales.gob.ar, UNESCO, ru-ar.ru, ruargentina.com — для проверки фактов при редакции.
