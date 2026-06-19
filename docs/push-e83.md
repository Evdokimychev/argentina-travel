# E83 — Web push-уведомления (VAPID)

Добавлен отдельный push-канал для личного кабинета туриста: подписка в браузере, хранение endpoint в Supabase и серверная отправка при смене статуса заявки.

## Что реализовано

| Компонент | Назначение |
|-----------|------------|
| `supabase/migrations/20250626000001_push_subscriptions.sql` | Таблица `push_subscriptions` + RLS-политики |
| `POST/DELETE /api/notifications/push/subscribe` | Подписка/отписка текущего пользователя |
| `public/sw-push.js` | Обработчик `push` и `notificationclick` |
| `PushNotificationsSection` в `/profile/settings` | Тумблер «Push-уведомления» с проверкой consent |
| `sendPushToUser()` | Отправка push по `user_id` через VAPID |
| `notifyBookingStatusChanged()` | Подключён push-канал для событий смены статуса |

## Согласие на cookies

Push включается только при согласии на аналитику (E80):

- клиент: тумблер блокируется без analytics consent;
- API: `POST /api/notifications/push/subscribe` возвращает `403`, если consent не дан;
- при отзыве согласия в баннере cookies подписка автоматически отключается.

## Переменные окружения

```env
NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY=
WEB_PUSH_VAPID_PRIVATE_KEY=
WEB_PUSH_VAPID_SUBJECT=mailto:ops@goargentina.ru
```

`sendPushToUser()` работает как no-op, если любой из ключей не задан.

## API

### POST `/api/notifications/push/subscribe`

Body:

```json
{
  "endpoint": "...",
  "p256dh": "...",
  "auth": "..."
}
```

### DELETE `/api/notifications/push/subscribe`

Body (опционально):

```json
{
  "endpoint": "..."
}
```

Если endpoint не передан, удаляются все push-подписки текущего пользователя.

## Проверка

1. Откройте `/profile/settings`.
2. Дайте согласие на аналитику в cookie-баннере.
3. Включите «Push-уведомления» и разрешите уведомления браузеру.
4. Измените статус заявки (`/api/bookings/[id]` или админ API) — должен прийти push.
5. Отключите согласие на аналитику — подписка должна удалиться автоматически.
