# E85: Флаги функций и лёгкие A/B-эксперименты

Реализован базовый механизм feature flags с процентным rollout и серверной оценкой для SSR.

## Что добавлено

- Миграция `supabase/migrations/20250626000001_feature_flags.sql`
- Таблица `feature_flags`:
  - `key` (PK)
  - `enabled` (`boolean`)
  - `rollout_percent` (`0..100`)
  - `metadata` (`jsonb`)
- Стартовые ключи:
  - `homepage_recommendations_v2`
  - `checkout_currency_default`

## Серверная оценка флага

Файл: `src/lib/feature-flags/server.ts`

- `getFlag(key, userId?)` возвращает итоговый boolean
- Для частичного rollout используется стабильный bucket (`0..99`) на основе `sha256(key:userId)`
- Правила:
  - `enabled = false` → всегда `false`
  - `rollout_percent = 0` → `false`
  - `rollout_percent = 100` → `true`
  - `1..99` → сравнение bucket с процентом rollout
- Есть кеш чтения флагов на сервере (TTL 30 сек) и принудительная инвалидация после изменений

## Клиентский хук

Файл: `src/lib/feature-flags/client.tsx`

- `useFeatureFlag(flagKey, options?)`
- Получает значение через `GET /api/feature-flags?key=...`
- Возвращает:
  - `enabled`
  - `loading`
  - `error`
  - `refresh()`

## API

### Публичный read API

- `GET /api/feature-flags?key=...`
- Оценка флага происходит на сервере с учётом текущего пользователя/анонимного идентификатора

### Admin API

Файл: `src/app/api/admin/feature-flags/route.ts`

- `GET` — список флагов
- `POST` — создать флаг
- `PATCH` — обновить `enabled`, `rollout_percent`, `metadata`
- `DELETE` — удалить флаг
- Guard: `system.settings`
- CRUD операции пишут запись в `admin_audit_log`

## Админский интерфейс

- Страница: `/admin/feature-flags`
- Компонент: `src/components/admin/views/FeatureFlagsView.tsx`
- Русский UI:
  - создание флага
  - изменение rollout и metadata JSON
  - включение/выключение
  - удаление
- Раздел добавлен в навигацию админки: «Флаги функций»

## Реальный флаг в прод-коде (E79)

На главной странице добавлен gate для блока персональных рекомендаций:

- Ключ: `homepage_recommendations_v2`
- Точка применения:
  - `src/app/page.tsx` — серверная проверка флага до SSR
  - `src/components/marketplace/MarketplaceHome.tsx` — условный рендер блока

Если флаг выключен, блок рекомендаций и связанные расчёты не выполняются.
