# Visual Page Builder — техническое решение

**Дата:** 21 июня 2026  
**Контекст:** Next.js 15 + Supabase CMS (Payload-подобные blocks/globals, без runtime Payload CMS)

---

## Сравнение open-source редакторов

| Решение | Стек | Плюсы | Минусы для нас |
|---------|------|-------|----------------|
| **Editor.js** | JSON blocks, vanilla | Простая модель блоков | Слабая React 19 экосystem, нет DnD из коробки, устаревает |
| **Tiptap** | ProseMirror, headless | Максимальная гибкость, extensions, Yjs | Нужно строить весь UI блоков с нуля (месяцы) |
| **Novel** | Tiptap + AI | Notion UX быстро | Заточен под AI autocomplete, мало кастомных travel-блоков |
| **BlockNote** | Tiptap + UI | DnD, slash menu, WYSIWYG из коробки | Свой JSON формат — конфликт с существующим Payload Blocks schema |
| **Payload Lexical** | Lexical в Payload CMS | Blocks + fields + admin | **Требует Payload runtime** — у нас Supabase `content_documents` |

### Выбор

**Гибридная архитектура (рекомендовано и внедряется):**

1. **Payload Blocks pattern** (уже есть) — `slug → schema → editor → renderer` в JSONB `content_documents.body`
2. **@dnd-kit** — drag & drop блоков и разделов (industry standard, React 19)
3. **RichTextEditor** (существующий) + опционально **Tiptap** позже для inline-форматирования в абзацах
4. **BlockNote** — не как storage, а как **UX-референс** для slash-menu (Phase 2)

> Полная миграция на Payload CMS или BlockNote document model **нецелесообразна**: 14+ блоков, resolvers, cutover, SEO — уже работают на Supabase.

---

## Целевая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│ VisualPageBuilder (admin / organizer / expert)              │
│  ├─ Sections (H2) — sortable                                │
│  │    └─ Blocks[] — sortable via @dnd-kit                   │
│  ├─ BlockPicker (Payload drawer pattern)                    │
│  ├─ BlockCard (fields | preview toggle)                     │
│  ├─ CmsSeoPanel (SEO fields)                                │
│  └─ usePageBuilderAutosave → content_documents + revisions  │
└─────────────────────────────────────────────────────────────┘
         │ JSONB body.sections[].blocks[]
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Public render pipeline                                      │
│  block-registry → normalize → renderPageBuilderBlock      │
│  BlogSectionBody | ContentSectionBody | AuthorArticleView │
└─────────────────────────────────────────────────────────────┘
```

### Типы контента (doc_type)

| doc_type | Статус | Page builder |
|----------|--------|--------------|
| `blog` | ✓ | VisualPageBuilder |
| `guide` | ✓ | VisualPageBuilder |
| `author_article` | ✓ | VisualPageBuilder (organizer/expert) |
| `knowledge` | ✓ | VisualPageBuilder + blocks в markdown body |
| `destination` | ✓ | Форма шапки + VisualPageBuilder (`sections`) |
| `place` | ✓ | Форма шапки + VisualPageBuilder (`sections`) |
| `landing` | ✓ Phase 3A | VisualPageBuilder → `/landing/[slug]` |
| homepage / marketplace hubs | Phase 3B | CMS modules strip (не article sections) |
| `legal` | rich-text sections | CmsSectionEditor |

---

## Каталог блоков (v3)

### Текст и структура
- `paragraph`, `subheading`, `bullets`, `steps`, `divider`, `table`

### Компоненты
- `callout` / `infobox` — Важно / Совет / Предупреждение
- `faq`, `accordion`, `checklist`, `comparison-table`, `cta`

### Медиа
- `media`, `gallery`, `video` (YouTube/Vimeo)
- `image-text` — фотография и редакционный текст с выбором стороны изображения
- `author-card` — автор/эксперт, роль, портрет и краткая биография

### Редакционные акценты
- `facts-grid` — компактная сетка фактов о месте, сезоне или маршруте
- `quote` — цитата автора, героя материала или местного эксперта

### Путешествия
- `map`, `route-map`, `seasons`, `budget`, `ticket-link`

### Комmerce / embeds
- `tour-booking` — CTA бронирования тура по slug
- `content-embed` — карточка тура / экскурсии / статьи
- `widget` — встраиваемый виджет (flights, map hub, …)

## Библиотека готовых секций

Конструктор поддерживает не только отдельные блоки, но и повторяемые композиции — по модели
WordPress Patterns / Elementor Kits. При добавлении секции создаются независимые копии блоков,
поэтому редактор может менять текст и фотографии, не затрагивая другие страницы.

| Секция | Состав | Для чего |
|--------|--------|----------|
| История направления | фото + текст, факты, цитата | Игуасу, ледники, регионы и места |
| Практический путеводитель | совет, чек-лист, FAQ | документы, транспорт, подготовка |
| Материал с автором | автор, цитата, галерея | блог, экспертные статьи, интервью |
| Введение к туру | фото + текст, параметры, бронирование | туры и авторские маршруты |
| Водопады Игуасу | фото + текст, факты, совет, галерея | тематическая страница природного места |
| Ледники Патагонии | фото + текст, сезоны, подготовка, галерея | ледники и сезонные природные маршруты |
| Городской путеводитель | фото + текст, факты, шаги, карта, совет | Буэнос-Айрес и другие города |
| Вино и гастрономия | фото + текст, сравнение, список, галерея | винные регионы и гастрономические поездки |
| Маршрут по дням | параметры, программа, карта, запасной план | самостоятельные и организованные поездки |

Picker использует общий доступный диалог, поиск по названиям, описаниям и тематическим тегам
(`Игуасу`, `ледники`, `рестораны`, `районы`, `итинерарий`), показывает число
результатов и позволяет выбрать как готовую секцию, так и один блок. Фото для новых медиа-блоков
выбираются через существующую медиатеку CMS.

---

## Роли и доступ

| Роль | Маршрут | Публикация |
|------|---------|------------|
| Admin | `/admin/content/documents/*` | Сразу / scheduled |
| Organizer | `/organizer/articles/*` | Draft → moderation (Phase 2) |
| Expert | `/experts/dashboard/articles` | Phase 2 |

`author_article.created_by` = profile id организатора.

---

## Автосохранение и preview

- **Autosave:** debounce 3s → PATCH document; localStorage fallback при offline
- **Preview:** существующий `CmsDocumentPreviewContent` + `?live=1`
- **Revisions:** `content_revisions` на каждый publish/save (уже есть)

---

## Roadmap

| Phase | Scope |
|-------|-------|
| **1 (текущий)** | DnD, +12 блоков, VisualPageBuilder, author_article, organizer editor |
| **2** | Editor UX: variants/density, structured rows, media picker, inline audit |
| **2b** | Slash menu, Tiptap inline в paragraph |
| **3** | Moderation workflow, expert cabinet, collaborative Yjs |
| **4** | Unified CmsPageBuilder for destination/place hero sections |

---

## Зависимости

```json
"@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"
```

Phase 2 (optional): `@blocknote/core`, `@blocknote/react`, `@tiptap/react`
