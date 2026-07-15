# Page Archetypes

## Public Hub

Для каталогов и тематических центров. Состав: `PageIntro`, один primary action, поиск/навигация, основное содержимое, контекстный следующий шаг.

## Editorial Detail

Для статей, мест и направлений. Состав: breadcrumbs, категория, заголовок, summary, дата проверки, автор, media, содержание, текст, связи и полезное следующее действие.

## Transactional

Для auth, checkout, booking lookup, payment и сложных форм. Минимум отвлечения, ясный прогресс, один primary action, сохранение ввода, error summary и восстановление после refresh.

## Workspace

Для profile, organizer и admin. Компактный header, task navigation, notifications, рабочее содержимое, без публичного длинного footer и тяжёлых публичных widgets.

## Общие состояния

- `LoadingState`: сохраняет геометрию будущего контента.
- `EmptyState`: объясняет отсутствие данных и предлагает одно реальное действие.
- `ErrorState`: простой текст, retry и безопасный выход.
- `SuccessState`: подтверждает результат и показывает следующий шаг.
- `PageStatus`: актуальность, модерация или состояние операции.
