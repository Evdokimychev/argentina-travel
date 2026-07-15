# Product Event Taxonomy

## Правила

- Формат: `domain_object_action`.
- Не передавать email, телефон, имя, user id, текст сообщений или booking token.
- Properties используют enum, boolean, coarse count bucket и route template.
- Событие отправляется только после согласия для необязательной аналитики.

## Основные события

| Event | Когда | Разрешённые properties |
| --- | --- | --- |
| `workspace_switch_completed` | Workspace подтверждён сервером | `from`, `to` |
| `next_action_opened` | Пользователь открыл NBA | `workspace`, `action_type` |
| `tour_search_submitted` | Отправлен поиск тура | `has_dates`, `filter_count_bucket` |
| `booking_request_submitted` | Сервер создал заявку | `source_type`, `workspace` |
| `booking_payment_opened` | Открыта доступная оплата | `provider`, `state` |
| `flight_search_submitted` | Партнёрская форма отправлена | `route_type`, `has_return` |
| `flight_widget_failed` | Widget перешёл в fallback | `stage`, `retry_count_bucket` |
| `organizer_task_opened` | Открыта задача | `task_type`, `urgency` |
| `organizer_article_submitted` | Редакция отправлена | `article_type`, `revision` |
| `cms_document_saved` | Server save успешен | `document_type`, `autosave` |
| `cms_document_published` | Publication успешна | `document_type`, `scheduled` |
| `map_object_selected` | Выбран marker/list item | `object_type`, `zoom_bucket` |
| `airport_route_opened` | Открыто направление | `route_type`, `source_age_bucket` |
| `consent_updated` | Пользователь изменил согласия | `analytics`, `personalization` |

## Цели Метрики

`booking_request_submitted`, `booking_payment_opened`, `flight_search_submitted`, `organizer_article_submitted`, `cms_document_published` и `next_action_opened` являются основными funnel goals. Goal payload не содержит персональные данные.
