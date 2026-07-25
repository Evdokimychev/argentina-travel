# Page Builder для страниц сайта (Phase 2)

## Цель

Редактор должен собирать не только статьи блога, но и другие CMS-страницы: путеводители, направления, места, базу знаний — из тех же блоков и паттернов.

## Что уже можно редактировать конструктором

| Тип | Шапка / факты | Тело (blocks) | Публичный рендер |
|-----|---------------|---------------|------------------|
| blog / author_article | SEO + excerpt | ✓ | `BlogSectionBody` |
| guide | description | ✓ | `ContentSectionBody` |
| knowledge | byline / SEO | ✓ (blocks → plain text в KB body) | markdown KB + structured text |
| destination | сезон, логистика, tips | ✓ `sections` | `CmsContentSections` |
| place | описание, facts, FAQ | ✓ `sections` | `CmsContentSections` |
| legal | — | CmsSectionEditor | legal view |
| landing | description / category | ✓ | `ContentPageView` · `/landing/[slug]` |

## Новые layout-блоки

- `hero-banner` — вводный баннер с CTA
- `related-links` — список внутренних ссылок
- `hub-cta-row` — ряд карточек действий

Travel widgets в picker: `season-matrix`, `tourism-infographic`, `tourism-timeline`.

## Новые паттерны

- `destination-page-body`
- `place-practical`
- `immigration-practical`
- `hub-intro`

## UX редактора

- Стартовые шаблоны при пустом документе
- Перемещение разделов стрелками
- Стабильные client id разделов (без remount при каждом keystroke)
- Safe fallback для неизвестного типа блока в карточке

## Phase 3A (сделано)

1. `landing` docType + публичный shell `/landing/[slug]`
2. Autosave в admin editor (status-preserving PATCH, без принудительного `draft`)
3. Device frames в CMS preview и каталоге редакционных блоков
4. Immigration bridge: короткие `content_pages` на `/immigration/[slug]` рядом с pillar topics
5. Исправление `content-mapper`: `sections` для destination/place

## Phase 3B — редактор: текст, виджеты, дизайн, ошибки (сделано)

Редактор карточки блока теперь позволяет:

- менять **текст и структуры** (пункты сводки, источники, фразы, варианты селектора, ссылки CTA) без «pipe»-форматов;
- выбирать **виды дизайна** (`variant`) и **плотность** (`density`) у lead / photo / summary / sources / tips / layout-блоков;
- настраивать **галерею** (вид сетка/лента, колонки, alt/подпись у каждого кадра);
- включать/выключать опции **travel-виджетов** (подсветка месяца, компактная инфографика);
- открывать **медиатеку** для photo / hero / gallery / image-text / author-card / media;
- видеть **ошибки и замечания** аудита прямо в карточке (alt, пустая галерея и т.п.) — без блокировки сохранения.

## Итерация A+B (сделано) — Tour layout bank + Design Library

См. исследование: [`competitive-builders-research.md`](./competitive-builders-research.md).

### Tour layout bank

- Контракт слотов: `src/lib/tour-detail/native-tour-layout-registry.ts`
- Compose поверх существующих секций: `compose-native-tour-main-column.tsx`
- `TourDetailView` (native) рендерит через compose; ветка Tripster/YouTravel без изменений
- `resolveNativeTourLayoutOrder(override?)` готов к будущему CMS override порядка

### Design Library

- Категории паттернов (`story` / `practical` / `tour` / `page` / `social`)
- Превью-чипы состава блока в picker и на пустом документе
- Новый паттерн `reviews-social-proof`
- UI: `DesignLibraryPatternCard`, вкладки категорий в `PageBuilderBlockPicker`

## Итерация C (сделано) — адаптация без ломки вертикали

Принцип: конструктор и layout-bank **обертывают** существующие страницы/секции, а не заменяют их вёрстку.

1. **Page template packs** — многосекционный импорт (`page-template-registry.ts`) из уже существующих patterns; пустой документ предлагает «шаблоны страниц» + «готовые секции».
2. **Tour layout order** — опциональный `detailLayoutOrder` на native tour; по умолчанию публичная колонка и nav идентичны прежнему порядку; UI в «Публикация» организатора.
3. **Homepage module strip** — `homepage-module-registry.ts` + `MarketplaceHome` рендерит те же секции через registry (default order = текущая вертикаль; hero вне strip). Persistence `site.homepage` — следующий шаг.

## Следующие итерации (Phase 3C+)

1. Persistence порядка модулей главной (`site.homepage`) без смены разметки секций
2. Immigration pillars cutover
3. Slash-menu / Tiptap только для inline paragraph (не замена блоков)
4. Spike Puck 48h для landing visual lane (go/no-go)
5. Полный Zod на editorial schemas
6. CMS-данные внутри season-matrix / tourism-timeline (не только display-props)
