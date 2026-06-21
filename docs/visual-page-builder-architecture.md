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
| `author_article` | **NEW** | VisualPageBuilder (organizer/expert) |
| `landing` | Phase 2 | Тот же builder, другой layout shell |
| `legal` | rich-text sections | CmsSectionEditor |
| `destination` / `place` | form fields | — |

---

## Каталог блоков (v2)

### Текст и структура
- `paragraph`, `subheading`, `bullets`, `steps`, `divider`, `table`

### Компоненты
- `callout` / `infobox` — Важно / Совет / Предупреждение
- `faq`, `accordion`, `checklist`, `comparison-table`, `cta`

### Медиа
- `media`, `gallery`, `video` (YouTube/Vimeo)

### Путешествия
- `map`, `route-map`, `seasons`, `budget`, `ticket-link`

### Комmerce / embeds
- `tour-booking` — CTA бронирования тура по slug
- `content-embed` — карточка тура / экскурсии / статьи
- `widget` — встраиваемый виджет (flights, map hub, …)

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
| **2** | Slash menu, Tiptap inline в paragraph, landing doc_type |
| **3** | Moderation workflow, expert cabinet, collaborative Yjs |
| **4** | Unified CmsPageBuilder for destination/place hero sections |

---

## Зависимости

```json
"@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"
```

Phase 2 (optional): `@blocknote/core`, `@blocknote/react`, `@tiptap/react`
