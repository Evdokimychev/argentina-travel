# UI baseline контентных поверхностей

Дата: 2026-07-15. Проверяемая среда: локальный Next.js dev server `http://localhost:3000`.

## Ограничение evidence

Подключённый browser runtime сообщил `No browser is available`, список доступных браузеров пуст. Поэтому в этом baseline нет скриншотов, визуального сравнения пикселей и фактического keyboard trace. Неинтерактивная часть проверена через локальные HTTP-ответы и server-rendered HTML, адаптивные/фокусные состояния — чтением компонентов. Перед release этот документ нужно дополнить снимками 390, 768 и 1440 px и axe/keyboard-протоколом.

## Проверенные маршруты

| Поверхность | Маршрут | HTTP | Наблюдение |
|---|---|---:|---|
| Путеводитель | `/guide` | 200 | hub с карточками тем и hardcoded ссылками в базу знаний |
| Guide topic | `/guide/ekonomika-i-dengi` | 200 | pillar, quick facts, HubToc, exchange widget; 3 пустых widget anchors |
| Иммиграция | `/immigration` | 200 | hub, чувствительные обещания требуют visible source/reviewer gate |
| Immigration page | `/immigration/grazhdanstvo` | 200 | content surface доступна; trust metadata неполна |
| Блог | `/blog` | 200 | крупный каталог; 87 indexable из 290 записей данных |
| Регионы | `/destinations` | 200 | 8 destination entities, cards/hub |
| Регион | `/destinations/ba` | 200 | галерея, highlights, logistics, tours/related; обязательная destination полнота отсутствует |
| Места | `/places` | 200 | 100 places, фильтры/карта/карточки |
| Место | `/places/perito-moreno-glacier` | 200 | detail, gallery/map/tours/related, публичный рейтинг без source contract |
| Карта | `/mapa-argentina` | 200 | fullscreen map hub и доступный list overlay |
| Search index | `/api/site/search-index` | 200 | 514 документов, 0 duplicate ids на момент проверки |

Размеры dev HTML/RSC отдельных ответов велики (например, `/blog`, `/destinations/ba` и `/places` — порядка сотен килобайт и более). Это диагностический сигнал о возможной передаче крупных каталогов, но не production performance metric; вывод возможен только после `next build` и route/bundle trace.

## Header и глобальный поиск

### Desktop

- Кнопка поиска видима в правой группе header.
- Карта, theme, locale/currency и profile соседствуют с ней.
- `⌘/Ctrl+K` открывает dialog.
- В модалке есть loading, типовые chips, сгруппированные результаты, highlight, стрелки/Enter/Escape.
- Dialog primitives должны обеспечивать focus trap; фактическая проверка браузером ещё нужна.

### Mobile

- Отдельная кнопка поиска остаётся в header; она не скрыта `max-sm`.
- В overlay меню есть вторая кнопка поиска; перед открытием поиска меню закрывается.
- Floating trigger самого `SiteSearch` скрыт до `sm`, но это не лишает мобильного пользователя входа благодаря header.
- Нужна проверка, не возникает ли переход фокуса между закрывающимся mobile menu и открывающимся search dialog.

### Дефекты

- В начале аудита фильтр `place` отдавал пустую static-группу. Параллельная правка добавила `place` в `TYPE_ORDER`; повторный запрос теперь возвращает Игуасу. API-regression test для принудительного fallback ещё нужен.
- Отдельного chip для `immigration` нет, хотя тип результатов поддерживается.
- Нулевое состояние не предлагает исправление, снятие фильтра или полезные хабы.
- SearchAction в schema указывает на поиск только по турам, а не на глобальный поиск.

## Оглавление и длинные статьи

### Переиспользуемое состояние

`TableOfContents` вместе с `useContentTocScrollSpy` имеет desktop sticky panel, mobile `<details>`, active section, `aria-current`, общие offset-классы и keyboard-focus стили. Это лучший кандидат на единый компонент.

### Фрагментация

`HubToc` и `GuidePillarToc` реализуют похожее поведение отдельно. Различия усложняют единый mobile/focus/back контракт и тестирование.

### Подтверждённый разрыв якорей

На `/guide/ekonomika-i-dengi` зарегистрированы ссылки:

| Fragment | TOC links | Targets | Результат |
|---|---:|---:|---|
| `#widget-exchange-rates` | 2 | 1 | работает |
| `#widget-calculator` | 1 | 0 | сломано |
| `#widget-map` | 1 | 0 | сломано |
| `#widget-promo` | 1 | 0 | сломано |

Причина: `GuideWidgetSlot` реализует `exchange-rates`, `weather-panel`, `season-matrix`, `tourism-infographic`, `tourism-timeline`, `tour-embed`, но возвращает `null` для объявленных типов `calculator`, `map`, `promo`.

### Mobile gap

Native `<details>` доступен как базовый control, но после выбора ссылки меню не закрывается программно, не зафиксирован возврат/перевод фокуса и нет отдельного восстановления состояния Back. Нужен браузерный тест на длинной статье.

## Хабы и article templates

### Путеводитель

Сильные стороны: визуально разделённые темы, reusable Hub components, rich pillar pages. Разрывы: несколько article models, hardcoded count/links, legacy `GuideTopicView`, отсутствие общего source/reviewer/changelog.

Пять ссылок hub → knowledge base на момент проверки отвечают 404:

- `/baza-znaniy/podgotovka-k-poezdke`;
- `/baza-znaniy/gid-po-dengam`;
- `/baza-znaniy/bezopasnost-argentina`;
- `/baza-znaniy/esim-i-svyaz`;
- `/baza-znaniy/voditelskie-prava`.

`/baza-znaniy/gid-po-transportu` отвечает 200. Поскольку база знаний параллельно перерабатывается, ссылки нужно повторно проверить непосредственно перед merge.

### Иммиграция

Текущие views поддерживают длинный объясняющий контент, но visible trust layer недостаточен для high-risk темы. Hero/hub формулировки «полный справочник», количество оснований и меняющиеся нормы должны формироваться из проверенного контента, а не быть самостоятельными маркетинговыми обещаниями.

### Блог

`BlogPostView` умеет rich blocks, inline maps, checklists, tables, FAQ, related cards и progress. При этом одна статья может одновременно получить inline related, sidebar resources, fresh posts, footer links, bottom related, cluster navigation и destination gallery. Нужен page-level dedupe и максимум один основной related block.

`getRelatedBlogPosts` заполняет лимит кандидатами даже при score 0. Это создаёт нерелевантные рекомендации только ради заполнения UI.

### Регионы

`DestinationDetailView` имеет hero/gallery, about, highlights, logistics, tips, tours и related. Для самостоятельного планирования не хватает баз/районов, перемещения внутри, stay, маршрутов разной длины, бюджета, связи/платежей, безопасности, accessibility/children/packing и источников.

Найдены публичные редакционные/placeholder формулировки:

- «Практические детали, карта и связанные точки маршрута — без дублирования регионального гида.»
- «Туры по этому направлению скоро появятся».

Обе следует заменить содержательным текстом или честным empty state без обещания срока.

### Места

`PlaceDetailView` имеет gallery, контент, карту, practical sidebar, tours и related. Нет видимых source/verified/reviewer блоков. Из 100 place listings 50 имеют `rating`; UI показывает `x / 5`, но нет источника, количества отзывов, даты или методологии. Числовой рейтинг должен быть скрыт до появления контракта.

## Карты

### Fullscreen map

Плюсы:

- category/layer filters;
- popup и list alternative;
- кнопки объектов доступны с клавиатуры;
- Escape закрывает popup/list;
- OSM/CARTO attribution;
- loading/error/empty states.

Пробелы:

- поиск — простой lowercase substring без общей диакритической нормализации/алиасов;
- фильтров season/duration/no-car/accessibility/children нет;
- focus trap и возврат фокуса list overlay требуют браузерной проверки.

### Inline maps

`ArticlePlacesMiniMap` и `BlogInlineMapBlock` переиспользуют геоданные и attribution, но видимая текстовая альтернатива рядом с inline map не закреплена как обязательная. Статья должна сохранять доступ к каждому месту без Leaflet/мыши.

## Контентные виджеты

| Виджет | Текущее состояние | Release gap |
|---|---|---|
| Курсы валют | В ходе параллельной правки переведён на официальный BCRA, 1-hour cache, source link, observed time, refresh и disclaimer | stale state/TTL не названы явно; pillar copy всё ещё описывает blue/MEP отдельно от официального виджета |
| Weather | Open-Meteo, loading/error/retry | fetchedAt/source не показаны рядом с данными |
| Climate normals | статический набор | нет source и normal period |
| Season matrix | scores 0–3, «лучший сезон» | нет видимой методологии/source/version |
| Flight price calendar | partner data, 24h cache, empty/fallback/disclaimer | нет observedAt/TTL в UI |
| Budget | статические labels/values | это не проверяемый estimator; нет assumptions/source/confidence |
| Tour embed | inventory-aware и может скрываться | пустой slot не должен оставлять TOC anchor |
| SocialFeed | 4 configured posts, fallback по placement type | нерелевантные destination/place могут получить одинаковую общую ленту |

## Related и social baseline

`RelatedContentCards` подходит как единая оболочка. Алгоритмы связи сейчас распределены между blog helpers, content page manual links и knowledge graph. Нельзя заполнять квоту score=0 материалами.

`SocialFeed` зарегистрирован для 11 placements, но доступно только четыре поста (три Buenos Aires, один Bariloche). `resolvePlacementConfig` может падать к default/home конфигурации, поэтому удалённые друг от друга регионы получают одну и ту же ленту. До появления релевантного контента default fallback на destination/place нужно отключить.

## Требуемые визуальные baseline после восстановления браузера

Снять светлую и тёмную тему, 390/768/1440 px:

1. `/guide`, `/guide/ekonomika-i-dengi` вверху, в середине и на broken widget anchor;
2. `/immigration` и один high-risk article;
3. `/blog` и rich article с таблицей, map, FAQ, related;
4. `/destinations/ba`, включая empty tours state;
5. `/places/perito-moreno-glacier`, включая rating и map;
6. `/mapa-argentina`: filters, popup, list alternative, error/empty;
7. SiteSearch: loading, results, filtered place, zero, error;
8. longform TOC: desktop sticky, mobile open/selected/closed, deep link.

Для каждого состояния записать focus order, результат axe, отсутствие horizontal overflow и перекрытия anchor sticky header.
