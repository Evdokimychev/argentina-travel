# Targeted benchmark: паттерны, а не визуальное копирование

Дата просмотра источников: 2026-07-15.

## Метод

Benchmark используется как проверка полноты, а не как источник готового интерфейса. Для каждого паттерна оцениваются:

- пользовательская задача;
- владелец транзакции и данных;
- переносимость в гибридную модель GoArgentina;
- влияние на мобильный UX, доступность и доверие;
- решение `adopt`, `adapt`, `reject` или `later`.

## Источники

| Продукт / система | Проверенный паттерн | Источник |
|---|---|---|
| Airbnb | Избранное сохраняет контекст поиска; совместное планирование | https://www.airbnb.com/help/article/1236 |
| Airbnb | Фильтры соответствуют задаче и типу предложения | https://www.airbnb.com/help/article/3740 |
| Airbnb | Оплата и её график объясняются до подтверждения | https://www.airbnb.com/help/article/2143 |
| Tripadvisor | В одну поездку сохраняются разные типы объектов, заметки и карта | https://no.tripadvisor.com/pages/savesfaq.html |
| Lonely Planet | Discovery начинается с направления и редакционного намерения; affiliate disclosure отделено от редакционной оценки | https://www.lonelyplanet.com/destinations и https://www.lonelyplanet.com/articles/where-to-go-when |
| GOV.UK Design System | Для многошаговой задачи лучше task/step pattern, а не раздутая глобальная навигация | https://design-system.service.gov.uk/patterns/navigate-a-service/ и https://design-system.service.gov.uk/patterns/step-by-step-navigation/ |
| GOV.UK Service Manual | Один сервис должен быть согласован по языку, данным и interaction patterns, даже когда участвуют разные организации | https://www.gov.uk/service-manual/design/introduction-designing-government-services |

## Принятые и адаптированные паттерны

| Паттерн | Решение | Применение в GoArgentina | Защитное условие |
|---|---|---|---|
| Task-first верхняя навигация | Adopt | `Куда поехать`, `Туры и экскурсии`, `Спланировать`, `Гид`, `Моя поездка` | Не удалять legacy URL; secondary links и redirects только после crawl |
| Destination → practicalities → offers | Adopt | Destination связывает места, сезоны, статьи, маршруты и предложения | Не превращать destination в SEO-страницу без уникальной пользы |
| Единая сохранённая поездка | Adapt | Избранные места, статьи, туры и practical tasks в trip workspace | Сначала единый data contract и права; не склеивать local и account state молча |
| Сохранение контекста поиска | Adapt | Даты, состав группы, фильтры и источник сохраняются при переходе в detail/back | Не хранить персональные данные в публичном URL |
| Карта + список как равноправные представления | Adopt | `/mapa-argentina` и каталоги используют общие фильтры и canonical objects | Список остаётся доступным без геолокации и WebGL |
| Disclosure до внешнего CTA | Adopt | Badge source, внешний icon, владелец оплаты/отмены до клика | Нельзя прятать disclosure только в footer или после перехода |
| Checkout summary перед подтверждением | Adapt | Для внутреннего offer: состав, итог, правила отмены, способ оплаты; для partner: handoff summary | Не показывать внутреннюю форму, если результат не сохраняется у GoArgentina |
| Task list для подготовки поездки | Adopt | Документы, билеты, страховка, связь, деньги, багаж как прогресс в `trip-prep` | Шаги должны быть полезны без искусственной геймификации |
| Контентная перелинковка по намерению | Adopt | Из статьи к месту/маршруту/туру и обратно | Related блок не должен быть случайной SEO-сеткой |
| Ролевой inbox | Adapt | Единый вход для туристических, organizer и support conversations с фильтром контекста | Partner messaging не имитируется как internal chat |
| Явный график и статус платежей | Later | Payment summary, due dates, refunds в кабинете | Только после production provider + reconciliation + notification evidence |

## Отклонённые паттерны

| Паттерн | Решение | Причина |
|---|---|---|
| Копирование marketplace UI и плотности Booking/Airbnb | Reject | Бренд и задача специализированного country guide требуют собственного визуального языка; важны принципы, не оболочка |
| Универсальная кнопка `Забронировать` | Reject | Скрывает разницу между внутренней заявкой, внешним checkout и lead к менеджеру |
| Платное/спонсорское ранжирование без маркировки | Reject | Конфликт с редакционным доверием и product truth |
| Полный mega-menu как sitemap | Reject | Перегружает header и создаёт конкурирующие точки входа |
| Обязательная геолокация для карты | Reject | Не нужна для изучения страны, ухудшает доверие и доступность |
| Фиктивная срочность, зачёркнутые цены и рейтинги | Reject | Без проверяемого источника являются ложным обещанием |
| Внутренний аккаунт как условие внешней покупки | Reject | Добавляет трение, хотя lifecycle остаётся у партнёра |
| Автоматическое объединение partner order с internal booking | Reject | Статусы и ответственность различаются; допустима только честная связанная запись с provenance |

## Gap-check для release candidate

### Discovery

- Верхний уровень всё ещё смешивает форматы и задачи; target IA описана в [architecture.md](./architecture.md).
- Search fallback работает, но единая taxonomy и typo/alias acceptance требуют общей проверки.
- Favorites пока не подтверждены как единая trip workspace для всех типов сущностей.

### Comparison

- Нужны единые факты карточки: цена basis, продолжительность, источник, доступность, cancellation owner.
- Listing/detail должны использовать один capability resolver.
- Map/list state и возврат из detail должны сохранять контекст.

### Conversion and aftercare

- Partner disclosure в ключевых verticals есть, но его единообразие между listing/detail/modal надо проверять регрессией.
- Internal payment нельзя выводить в общую product promise до live provider evidence.
- Партнёрская покупка и внутренняя заявка должны иметь разные aftercare explanations.

### Content trust

- Нужны author/reviewer, source, reviewed date и correction route для чувствительного контента.
- Affiliate disclosure не должно ставить под сомнение независимость редакционного материала.
- Related content строится по canonical relations и user intent, а не только по тегу.

## Acceptance criteria для внедрения паттерна

Паттерн считается принятым только если:

1. решает измеримую пользовательскую задачу;
2. одинаково объясняет владельца действия в UI, письме и кабинете;
3. работает с клавиатуры и на мобильном viewport;
4. имеет empty/error/partial state;
5. не создаёт ложную внутреннюю capability;
6. покрыт событием и тестом;
7. имеет owner и rollback.
