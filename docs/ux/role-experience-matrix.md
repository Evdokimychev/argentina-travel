# Role Experience Matrix

## Рабочие пространства

| Workspace | Кто видит | Главная точка входа | Основная цель |
| --- | --- | --- | --- |
| Путешествия | tourist, organizer, admin | `/profile` | Планирование, заявки, поездки, сообщения |
| Организатор | organizer, admin с ролью organizer | `/organizer` | Заявки, туры, статьи, отзывы |
| Управление сайтом | admin | `/admin` | Продажи, контент, платформа |

Гость не имеет workspace и остаётся на публичной части. Список доступных workspace строится только из серверно подтверждённых ролей.

## Матрица действий

| Действие | Guest | Tourist | Organizer | Admin |
| --- | --- | --- | --- | --- |
| Смотреть контент и каталог | Да | Да | Да | Да |
| Сохранять и бронировать | После входа | Да | В workspace «Путешествия» | В workspace «Путешествия» |
| Управлять своими турами | Нет | После подключения роли | Да | Только при organizer capability |
| Писать авторские статьи | Нет | Нет | Да, с модерацией | Проверка и публикация |
| Управлять контентом сайта | Нет | Нет | Нет | По capability |
| Менять реальные роли | Нет | Запрос organizer role | Нет | Через защищённый admin flow |
| Выбирать active workspace | Нет | Из доступных | Из доступных | Из доступных |

## Безопасность переключения

1. Cookie хранит только предпочтение workspace.
2. Resolver каждый раз пересекает предпочтение с серверными ролями.
3. Недоступное значение заменяется безопасным fallback: travel, затем organizer, затем admin.
4. Смена workspace не выдаёт роль и не заменяет route authorization.
5. В analytics уходит только workspace id, без user id, email, имени или содержимого заявок.

## Next Best Action

Tourist: payment due, unread message, upcoming trip, draft itinerary, favorites, destination discovery.

Organizer: new booking, unanswered message, pending confirmation, expiring reserve, payment due, no dates, draft moderation, editorial feedback, unanswered review, incomplete profile.

Admin: booking/payment incidents, unanswered leads, moderation queue, content quality, email/webhook/database health.
