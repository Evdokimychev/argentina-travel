# PROJECT — «Пора в Аргентину»

## Что это

Туристический портал на русском языке: каталог туров и экскурсий, блог, путеводитель, бронирование через партнёров (Tripster, YouTravel, Travelpayouts, Sputnik8) и собственные туры организаторов.

**Production:** https://www.goargentina.ru

## Владелец и процесс

- UX/UI дизайнер, разработка вместе с Cursor AI
- Приоритет: достоверность контента, понятный UX, стабильный booking flow

## Ключевые сущности

| Сущность | Где в коде |
|----------|------------|
| Туры (marketplace) | `src/app/tours/`, `src/lib/partner-tours/` |
| Экскурсии Tripster | `src/app/excursions/`, `src/lib/tripster/` |
| Организаторы | `src/app/organizer/`, CRM |
| Блог / CMS | `src/app/blog/`, `content/`, Supabase CMS |
| Места / карты | `src/app/places/`, Leaflet maps |
| Бронирование | `src/lib/booking/`, partner checkout |

## Принципы

- **AI-first:** анализ → план → код → проверки → документация
- **Системный подход:** любое изменение — через туриста, организатора, CRM, будущую оплату
- **Редакционный стандарт:** литературный русский, факт-checking
- **Security by default:** RLS, server-only secrets

## Структура репозитория

```
src/app/          — Next.js App Router
src/components/   — UI компоненты
src/lib/          — бизнес-логика, API clients
supabase/         — миграции, RLS
prisma/           — legacy/sync schema
docs/             — документация
scripts/          — автоматизация и аудиты
tests/e2e/        — Playwright
.cursor/rules/    — правила для AI
```

См. также [ARCHITECTURE.md](./ARCHITECTURE.md), [STACK.md](./STACK.md).
