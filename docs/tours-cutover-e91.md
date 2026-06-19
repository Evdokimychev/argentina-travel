# E91: Tours cutover — Supabase как единый источник правды

## Цель

Переключить публичный каталог туров на Supabase как основной источник данных и убрать зависимость от локальных override для опубликованных туров в браузере.

## Что изменено

1. **Источник данных каталога (`supabase|hybrid`)**
   - Добавлен режим `NEXT_PUBLIC_TOURS_SOURCE`:
     - `supabase` (по умолчанию) — строгий режим, опубликованные туры читаются только из Supabase.
     - `hybrid` — Supabase-first с fallback на TS seed/local repository.
   - Логика выбора вынесена в `src/lib/auth-mode.ts`.

2. **Новый server cutover-слой**
   - Добавлен `src/lib/tours-server-cutover.ts`:
     - `fetchCutoverPublishedTourListings()`
     - `fetchCutoverPublishedTourSlugs()`
     - `fetchCutoverTourDetailBySlug()`
     - `fetchCutoverCanonicalTourBySlug()`
   - В strict-режиме (`supabase`) при недоступности БД нет автоматического отката на TS seeds.

3. **Подключение cutover-слоя в публичный контур**
   - `src/data/marketplace-tours-server.ts` — чтение платформенных туров через cutover helper.
   - `src/lib/tours-server.ts` — чтение деталей тура через cutover helper.
   - `src/app/tours/[slug]/page.tsx` — slugs и canonical-тур через cutover helper.
   - `src/lib/sitemap-urls.ts` — sitemap slug-список туров через cutover helper.

4. **Обновлён `tour-repository.ts`**
   - В remote-режиме чтение списка туров (`fetchRepositoryMarketplaceTours`) идёт через Supabase/API first.
   - Для `NEXT_PUBLIC_TOURS_SOURCE=supabase` отключены localStorage override опубликованных туров:
     - опубликованные туры не сохраняются как локальные override;
     - `getRepositoryTourDetail()` не подменяет SSR-данные для `published`;
     - client sync для каталога/деталей возвращает серверные данные без локальной подмены.
   - Локальный flow черновиков организатора сохраняется.

5. **Миграция БД для cutover**
   - `supabase/migrations/20250627000000_tours_cutover_e91.sql`:
     - backfill `published_at` для опубликованных записей;
     - check-constraint на непустой `owner_user_id`;
     - check-constraint: `status='published'` требует `published_at is not null`;
     - индексы под public listing/moderation и owner/status выборки.

## Переменные окружения

Добавлено в `.env.example`:

- `NEXT_PUBLIC_TOURS_SOURCE=supabase`

Рекомендуемое production-значение для E91: `supabase`.
