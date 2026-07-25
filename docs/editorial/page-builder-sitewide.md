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

## Следующие итерации (Phase 3C+)

1. Композиция homepage / marketplace через CMS modules (не через article sections)
2. Immigration pillars cutover (полноценный CMS override pillar shell)
3. Slash-menu / Tiptap для inline paragraph
4. Полный Zod на editorial schemas (сейчас lightweight validators)
5. CMS-редактирование данных внутри season-matrix / tourism-timeline (не только display-props)
