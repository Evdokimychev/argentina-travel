# Mobile Acceptance

## Обязательные размеры

320x568, 360x800, 390x844, 430x932, 768x1024. Desktop reference: 1024x768, 1280x800, 1440x900, 1920x1080.

## Общие критерии

- Нет горизонтального scroll и визуально обрезанных controls.
- Fixed action находится выше safe area и экранной клавиатуры.
- Текст не перекрывает соседние элементы.
- Back сохраняет понятный контекст и scroll position.
- Dialog/sheet можно закрыть, focus возвращается.
- Tap targets не меньше 44x44 px.

## Flights

- Airport fields, date range, passengers и CTA помещаются в 320 px.
- Partner lifecycle имеет bounded retry, cleanup и fallback.
- MutationObserver не наблюдает весь `document.body`.
- Resize не отправляется на каждый scroll.
- Проверяются iPhone SE, iPhone 13/14, Pixel 7 и iPad.

## Tour itinerary

- Номер дня не занимает отдельную широкую колонку.
- Основное место получает описание и media карточки программы.
- Sticky booking action не перекрывает содержание.
