# Спецификация контентных шаблонов

Дата: 2026-07-15. Статус: целевой контракт для поэтапной миграции без массовой переделки UI.

## Цель

Свести путеводитель, иммиграцию, базу знаний, регионы, места и блог к общему проверяемому каркасу. Визуальное оформление может различаться, но доверие, навигация, источники, связанные материалы и виджеты должны работать по одному контракту.

## Текущее состояние

В проекте одновременно живут как минимум четыре семьи материалов:

| Семья | Основной view | Сильные стороны | Разрыв контракта |
|---|---|---|---|
| Статические guide/immigration pages | `ContentPageView` | общий reading layout, desktop/mobile TOC, share, related | нет author/editor/reviewer, списка источников, hero credit, changelog, risk level |
| Pillar guide/immigration | `GuidePillarView`, `ImmigrationPillarView` | hero, quick facts, HubToc, FAQ, виджеты | отдельный TOC и модель; нет единого source/review gate; слот может вернуть `null` при активной ссылке |
| Блог | `BlogPostView` + rich/manual renderers | богатые блоки, progress, карты, чеклисты, FAQ | связанные блоки дублируются; ratings без методологии; metadata/источники непоследовательны |
| Регионы и места | `DestinationDetailView`, `PlaceDetailView` | gallery, карта, туры, related | нет обязательной полноты destination template, visible verification/source metadata; рейтинг места не имеет источника |

`GuideTopicView` остаётся legacy-путём без общего TOC и trust-блоков. Его следует мигрировать первым как небольшой доказательный срез.

## Общая модель ArticleShell v2

Все публичные материалы должны предоставлять следующий минимальный набор:

```ts
type ArticleShellV2 = {
  id: string;
  schemaVersion: 2;
  contentType: "guide" | "immigration" | "knowledge" | "destination" | "place" | "blog";
  slug: string;
  canonicalUrl: string;
  title: string;
  dek: string;
  hero?: MediaRef;
  breadcrumbs: BreadcrumbRef[];
  authors: PersonRef[];
  editor?: PersonRef;
  reviewer?: PersonRef;
  publishedAt: string;
  updatedAt: string;
  verifiedAt?: string;
  reviewDueAt?: string;
  riskLevel: "low" | "medium" | "high";
  summary?: SummaryBlock;
  sections: ArticleSection[];
  sources: SourceRef[];
  claimSources?: ClaimSourceRef[];
  widgets?: WidgetSlot[];
  related?: RelatedRef[];
  changelog?: ChangeRef[];
  seo: SeoFields;
};
```

`updatedAt` — дата содержательного изменения, а не сборки. `verifiedAt` — дата последней проверки фактов. Для legal/immigration/medical/financial/safety материалов без reviewer, официального источника и актуального `verifiedAt` публикация блокируется.

## Обязательный порядок страницы

1. breadcrumbs;
2. content-type label, H1 и dek;
3. авторство, редактор/проверяющий, даты обновления и проверки;
4. hero с caption и credit, если есть;
5. краткий ответ/ключевые факты;
6. предупреждение только когда риск действительно требует его;
7. оглавление;
8. основные секции и контекстные виджеты;
9. FAQ, если вопросы не дублируют основной текст;
10. источники и дата доступа;
11. changelog для high-risk материалов;
12. один объяснимый блок related content;
13. коммерческий блок только при релевантном инвентаре и с disclosure.

## Обязательные секции по типам

### Путеводитель / база знаний

- быстрый ответ;
- кому и когда это нужно;
- пошаговая практика;
- стоимость/время/ограничения с датой и источником;
- частые ошибки;
- альтернативы;
- связанный регион/место/маршрут;
- источники и `verifiedAt`.

### Иммиграция

- статус информации и jurisdiction;
- кому подходит основание;
- требования и исключения;
- документы;
- официальный процесс по шагам;
- сроки и сборы только с официальными источниками и датой;
- риски отказа/изменения правил;
- официальный контакт/ссылка;
- reviewer, `verifiedAt`, `reviewDueAt`, changelog;
- явная граница между фактом, редакционным объяснением и консультацией.

Нельзя публиковать чувствительный материал с формулировкой «полный справочник», если source/reviewer gate не пройден.

### Регион / destination

- кому подходит и кому не подходит;
- лучший сезон с методологией;
- базы и районы для проживания;
- как добраться;
- перемещение внутри региона, включая сценарий без машины;
- варианты размещения;
- маршрут на 2–3 и 5–7 дней;
- бюджет с допущениями;
- еда;
- связь и платежи;
- безопасность;
- доступность, поездка с детьми;
- что взять;
- ближайшие места;
- интерактивная карта и текстовая альтернатива;
- проверенные источники и дата.

В публичном тексте запрещены редакционные заглушки вроде «без дублирования регионального гида» и обещания «скоро появится» вместо честного empty state.

### Место / point of interest

- почему стоит ехать и кому подходит;
- категория, регион, координаты;
- как добраться и сколько времени закладывать;
- сезон/часы/стоимость с датой и источником;
- доступность и ограничения;
- безопасность;
- галерея с правами/credit;
- карта + текстовый список;
- близкие места и релевантные маршруты;
- `verifiedAt` и источники.

Любой рейтинг требует источника, количества оценок, даты и методологии. До появления этих данных числовые рейтинги и звёзды скрываются.

### Блог

- редакционная ценность и авторская перспектива;
- дата публикации/обновления;
- автор и редактор;
- оглавление для длинного текста;
- фактологические утверждения через общую source model;
- не более одного related-блока внизу плюс максимум один контекстный inline-блок;
- FAQ только для реальных дополнительных вопросов;
- ratings/comparisons только с методологией и источником.

## Контракт секции и якоря

```ts
type ArticleSection = {
  id: string;              // стабильный, уникальный в документе
  heading: string;
  level: 2 | 3;
  blocks: ContentBlock[];
  sourceIds?: string[];
};

type WidgetSlot = {
  id: string;
  widgetId: string;
  label: string;
  required: boolean;
  status: "ready" | "unavailable" | "hidden";
  input: unknown;
};
```

Правило: ссылка TOC создаётся только для фактически отрисованной секции или слота. `return null` при сохранённом TOC item запрещён. Для необязательного виджета empty/error state остаётся в том же anchor-контейнере; для скрытого виджета удаляется и anchor.

## Единое оглавление

Базой следует оставить `TableOfContents` + `useContentTocScrollSpy` + `siteScrollAnchorClass` и постепенно перевести на них `HubToc` и `GuidePillarToc`.

Требования:

- одинаковые ids на сервере и клиенте;
- active section и `aria-current`;
- корректный offset под sticky header;
- desktop sticky panel, mobile `<details>`/sheet;
- после выбора мобильный список закрывается;
- фокус возвращается на trigger или переходит к заголовку секции;
- Back восстанавливает предыдущее положение без нового route transition;
- «к началу» появляется только на длинных материалах;
- TOC скрывается при менее чем двух секциях;
- no-js ссылки остаются рабочими.

## Источники и доверие

Переиспользовать модель из `content-governance.md`, `source-registry.csv`, `claim-registry.csv` и `sensitive-claims.csv`.

Видимый источник содержит publisher, title, URL, тип authority, дату публикации/обновления и дату доступа. Для динамического виджета рядом с данными показываются source, fetched/observed time, TTL и stale state. Общий список источников внизу не заменяет per-claim связь для чувствительных фактов.

## Related content

Один общий `RelatedContentCards` должен получать уже отобранные связи, а не сам заполнять квоту любыми материалами.

Приоритет связей:

1. ручная редакционная связь;
2. общая сущность/регион/намерение;
3. подтверждённый topic cluster;
4. поведенческий сигнал только после достаточного объёма данных.

Если score равен нулю или цель не опубликована, карточка не показывается. Блок скрывается, когда нет 2–3 сильных связей. Дубли одного URL между inline, sidebar и footer запрещены.

## Карты

Переиспользовать `ArgentinaMapFullscreenHub`, `MapControlsPanel`, `MapCategoryFilters`, `MapObjectPopup`, доступный список, `ArticlePlacesMiniMap` и `BlogInlineMapBlock`.

Для article mini-map обязателен видимый текстовый список мест; карта не является единственным способом открыть объект. Для fullscreen overlay нужны focus trap, Escape и возврат фокуса. Фильтры целевого хаба: тип, регион, сезон, длительность, без машины, доступность и поездка с детьми. Поиск карты использует ту же нормализацию и алиасы, что и глобальный поиск.

## Виджеты

Единый реестр находится в `widget-registry.csv`. Виджет допускается в материал только если:

- зарегистрирован `schema_version` и owner;
- определены loading/empty/error/stale states;
- источник и timestamp видимы там, где данные меняются;
- задана доступная неинтерактивная альтернатива;
- есть analytics event и performance budget;
- есть тест на несовпадение TOC/renderer.

Типы `calculator`, `map` и `promo`, объявленные в денежном pillar, сейчас не реализованы в `GuideWidgetSlot`: три якоря ведут в пустоту. До реализации их нужно удалить из content model/TOC или дать полноценные состояния.

## Переиспользуемые компоненты

| Задача | Оставить базой |
|---|---|
| Каркас чтения | `ContentReadingLayout`, `ArticleReadingProgress` |
| Оглавление | `TableOfContents`, `useContentTocScrollSpy`, `siteScrollAnchorClass` |
| Боковая панель | `CollapsibleAsidePanel` |
| Related | `RelatedContentCards` |
| Hub primitives | `HubHero`, `HubSection`, `HubQuickFactsGrid` |
| Галерея | `DetailPhotoGallery`, `PageSlotImage` |
| Карта | компоненты `ArgentinaMapFullscreenHub` и mini-map |
| Structured data | `BreadcrumbListJsonLd`, `ContentArticleJsonLd`, FAQ/WebPage JSON-LD |

## Первый минимальный срез

1. Ввести adapter `ArticleShellV2` без удаления старых моделей.
2. Перевести один `GuideTopicView` и один high-risk immigration page.
3. Подключить единый TOC, metadata, source list и related block.
4. Добавить publication gate для источников/reviewer/verifiedAt.
5. Удалить или реализовать три пустых widget slot на денежной странице.
6. Закрепить visual/a11y/contract тестами из `content-test-matrix.md`.

После успешного пилота мигрировать pillar, destination/place и только затем сложные rich blog articles. Это уменьшает риск массового визуального и SEO-регресса.
