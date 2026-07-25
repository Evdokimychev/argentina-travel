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

## Следующие итерации (Phase 3+)

1. `landing` docType + публичный shell для маркетинговых страниц
2. Композиция homepage / marketplace через CMS modules (не через article sections)
3. Immigration pillars cutover
4. Autosave в admin editor
5. Slash-menu / Tiptap для inline paragraph
6. Device frames в preview
