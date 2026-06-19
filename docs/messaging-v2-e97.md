# E97 — Полировка сообщений и уведомлений (Unified Inbox Realtime v2)

## Что изменили

1. `MessagesInboxView` в удаленном режиме теперь загружает список диалогов из Supabase API (`/api/conversations/inbox`), а не из localStorage.
2. Добавили Realtime-обновления счетчиков непрочитанных сообщений для:
   - `OrganizerSidebar`
   - `ProfileSidebar`
   - мобильной навигации профиля
3. Подключили триггеры уведомлений о новом сообщении:
   - in-app событие в `notification_events`
   - push-уведомление (если устройство подписано)
   - email-уведомление (с учетом пользовательских настроек категории)
4. Добавили напоминания за 24 часа до начала тура:
   - cron-маршрут `/api/cron/messaging/booking-reminder-24h`
   - запуск через оркестратор `/api/cron/platform-maintenance`
   - отправка in-app + push + email для туриста и организатора

## Новые и обновленные API

- `GET /api/conversations/inbox`
  - `role=tourist|organizer`
  - `limit=1..100`
  - ответ: `threads[]` + `unreadCount`
- `GET /api/conversations/inbox?summary=1`
  - быстрый ответ со счетчиком `unreadCount` для бейджей

## Realtime-поток (v2)

- Клиентский хук `useConversationInboxRealtime` подписывается на:
  - `conversation_messages` (INSERT)
  - `message_reads` (INSERT)
- При событии:
  - обновляется список диалогов/счетчики через API
  - отправляется `MESSAGES_UPDATED_EVENT` для синхронизации UI-бейджей

## Уведомления и шаблоны писем

Добавлены шаблоны:

- `email-templates/new-message.ts`
- `email-templates/booking-reminder-24h.ts`

Новые функции доставки:

- `sendConversationNewMessageEmail(...)`
- `sendBookingReminder24hEmail(...)`

Новый модуль orchestration:

- `lib/notifications/messaging-notify.ts`
  - `notifyConversationMessageCreated(...)`
  - `notifyBookingReminder24h(...)`

## Cron и эксплуатация

- Новый cron endpoint:
  - `/api/cron/messaging/booking-reminder-24h`
- Оркестратор `platform-maintenance` вызывает его каждый час (`minute < 5`).
- Авторизация как у остальных cron-маршрутов (`x-vercel-cron` или `CRON_SECRET`).

## Проверка после выката

1. Открыть профиль туриста и кабинет организатора в двух вкладках.
2. Отправить сообщение из одной стороны:
   - новое сообщение появляется в диалоге
   - бейдж `Сообщения` обновляется без перезагрузки
3. Проверить доставку:
   - push приходит при активной подписке
   - email приходит при включенной категории уведомлений
4. Прогнать cron вручную:
   - `GET/POST /api/cron/messaging/booking-reminder-24h`
   - убедиться, что маршруты логируются в cron health.
