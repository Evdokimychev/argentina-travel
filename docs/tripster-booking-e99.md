# E99: Tripster native booking flow в ЛК

## Что реализовано

- Добавлен отдельный endpoint `POST /api/tripster/booking-request` для отправки заявок Tripster из карточки экскурсии.
- Добавлен `GET /api/tripster/booking-request` для туристического ЛК (список и статусы заявок пользователя).
- Все отправки пишутся в таблицу `tripster_booking_requests` (успешные, fallback и ошибки).
- В админке (раздел экскурсий) добавлен просмотр последних заявок Tripster и агрегат по статусам.
- На странице `/profile/bookings` добавлен отдельный блок «Заявки в Tripster».

## UX на карточке экскурсии

- Для Tripster при активном Partner API кнопка в форме показывает текст **«Забронировать на сайте»**.
- Если Partner API недоступен (нет ключей/временная ошибка), возвращается режим `affiliate_fallback` и пользователь мягко перенаправляется на deep-link `/api/affiliate/go/[slug]` с датой, временем и количеством участников.

## API: `POST /api/tripster/booking-request`

Тело запроса:

- `slug`
- `date`
- `time`
- `personsCount`
- `name`
- `email`
- `phone`
- `messageToGuide` (опционально)

Ответы:

- `ok: true, mode: "tripster_order"` — создан внешний заказ Tripster.
- `ok: false, mode: "affiliate_fallback"` — graceful fallback на партнёрский deep-link.
- Ошибка валидации / авторизации / внешнего API — с корректным HTTP-статусом.

## ЛК туриста

В `/profile/bookings` заявки Tripster выводятся отдельно от внутренних бронирований платформы:

- экскурсия;
- дата/время и участники;
- статус заявки;
- ссылка «Открыть заказ на сайте» (если есть `tripster_order_url`).

## Админка

В `/admin/marketplace/excursions` добавлено:

- количество заявок Tripster;
- срез по статусам;
- список последних заявок с контактом туриста, датой события, статусом и ссылкой на внешний заказ.
