# E92 — Серверное избранное (туры, экскурсии и места)

Добавлено серверное избранное для авторизованных пользователей: данные хранятся в Supabase, а клиент работает с офлайн-очередью и синхронизацией при восстановлении сети.

## Что реализовано

- Миграция `supabase/migrations/20250626000012_user_favorites.sql`:
  - таблица `public.user_favorites` (`user_id`, `item_type`, `item_id`, `item_slug`, `created_at`);
  - уникальность на уровне `(user_id, item_type, item_slug)`;
  - RLS-политики: пользователь видит и изменяет только свои записи.
- Миграция `supabase/migrations/20250628000001_user_favorites_place.sql`:
  - `item_type` дополнен значением `place` для справочника мест;
  - существующие RLS-политики покрывают новый тип без изменений.
- API `GET/POST/DELETE /api/favorites`:
  - `GET` возвращает избранное текущего пользователя;
  - `POST` добавляет один или несколько элементов (с дедупликацией);
  - `DELETE` удаляет элемент по `itemType + itemSlug`.
- Клиентская синхронизация:
  - при входе выполняется merge локального избранного с сервером;
  - при офлайне изменения ставятся в очередь в `localStorage`;
  - при событии `online` очередь автоматически отправляется на сервер.
- Обновлён `useFavoriteTour`:
  - для авторизованного пользователя (туры, экскурсии, места) работает через API;
  - при сетевых ошибках сохраняет действие в офлайн-очередь.
- Обновлена страница `/profile/favorites`:
  - при авторизации подтягивает данные через `/api/favorites`;
  - локальный стор остаётся кэшем и источником мгновенного UI-обновления.

## Формат API

### GET `/api/favorites`

Ответ:

```json
{
  "favorites": [
    {
      "tourId": "org-iguazu",
      "tourSlug": "iguazu-2-days",
      "tourTitle": "Водопады Игуасу за 2 дня",
      "tourImage": "https://...",
      "kind": "tour",
      "addedAt": "2026-06-19T00:00:00.000Z"
    }
  ]
}
```

### POST `/api/favorites`

Тело:

```json
{
  "items": [
    { "itemType": "tour", "itemId": "org-iguazu", "itemSlug": "iguazu-2-days" },
    { "itemType": "excursion", "itemId": "12345", "itemSlug": "tripster-12345-city-walk" },
    { "itemType": "place", "itemId": "el-calafate", "itemSlug": "el-calafate" }
  ]
}
```

Можно передавать и одиночный элемент тем же форматом.

### DELETE `/api/favorites`

Тело:

```json
{
  "itemType": "tour",
  "itemSlug": "iguazu-2-days"
}
```

## Офлайн-режим

- Локальный кэш избранного: `argentina-travel-favorites`.
- Очередь синхронизации: `argentina-travel-favorites-sync-queue-v1`.
- Если сеть недоступна, `toggle` обновляет UI сразу и сохраняет операцию в очередь.
- После возврата сети и при повторном входе очередь автоматически отправляется на сервер.
