# Аудит контента и UX/UI блога «Пора в Аргентину»

**Дата:** 21.06.2026  
**Ветка:** `cursor/blog-rich-national-park-guides`  
**Охват:** все индексируемые статьи (`filterIndexableBlogPosts`)

---

## 1. Сводка каталога

| Метрика | Значение |
|---------|----------|
| Всего в каталоге | 276 |
| Индексируемые (класс A) | **73** |
| С секциями (section posts) | 60 |
| Rich-гайды (нацпарки) | 13 |
| Featured | 22 |
| Editorial reviewed | 73 |
| С секцией FAQ | 54 |
| Длинные статьи (8+ секций, TOC) | 20 |

### Категории rich-гайдов (13)

`natsionalnyy-park-tierra-del-fuego`, `natsionalnyy-park-nauel-uapi`, `natsionalnyy-park-los-glasiares`, `natsionalnyy-park-iguasu`, `natsionalnyy-park-poluostrov-valdes`, `natsionalnye-parki-argentiny`, `natsionalnyy-park-ibera`, `natsionalnyy-park-lanin`, `natsionalnyy-park-los-alerses`, `natsionalnyy-park-los-cardones`, `natsionalnyy-park-patagonia`, `natsionalnyy-park-talampaya`, `banado-la-estrella`

---

## 2. Состояние до изменений (gaps)

### Рендеринг section-постов
- **Критично:** `BlogPostView` разбивал тело секции по `.!?` — уничтожались списки (`*`), чек-листы (`□`), таблицы (`\t`), подзаголовки и FAQ.
- Не было callout-блоков, styled FAQ UI (только JSON-LD), styled таблиц и чек-листов.
- TOC показывался при 2+ секциях — шум на коротких материалах.
- «Похожие статьи» вместо «Читайте также».
- Одно section-image (`section-1`) только после второй секции.
- Editorial overrides склеивали абзацы через пробел — терялись `\n\n`.

### Rich-посты
- Полноценная вёрстка (callout, table, FAQ, gallery), но callout-варианты ограничены (`info` / `tip` / `warning`), дублирование компонентов с section-постами.

### A11y / mobile
- Таблицы без горизонтального scroll-контейнера в section-постах.
- FAQ без accordion UI (только plain text + JSON-LD).
- Конtrast callout-блоков не унифицирован.

---

## 3. Реализованная design system

### Новые компоненты (`src/components/blog/`)

| Компонент | Назначение |
|-----------|------------|
| `BlogCallout.tsx` | 6 вариантов: Важно, Совет, Лайфхак, Что нужно знать, Ошибка туристов, Внимание |
| `BlogChecklist.tsx` | □ / ❌ списки с иконками |
| `BlogContentTable.tsx` | Таблицы с overflow-x, caption, scope |
| `BlogStepList.tsx` | Нумерованные шаги |
| `BlogSectionDivider.tsx` | Визуальный разделитель |
| `BlogFaqSection.tsx` | Accordion FAQ (details/summary) |
| `BlogSectionBody.tsx` | Рендер распарсенных блоков |
| `BlogPostSectionView.tsx` | Секция + accent border + section-images |

### Парсер (`src/lib/blog-section-body.ts`)

Авто-детекция без правки прозы:

| Паттерн | Результат |
|---------|-----------|
| `\n\n` + `* item` | Bullet list (styled) |
| `□ item` / `❌ item` | Checklist |
| `1. step` | Step list |
| Строки с `\t` | Table |
| `**Совет:**`, `**Важно:**`, … | Callout |
| `> [!tip]`, `> [!warning]`, … | Callout (markdown marker) |
| Заголовок «Часто задаваемые вопросы» | FAQ accordion |
| «Типичные ошибки» / «Ошибки туристов» | Пары title+body → mistake callouts |
| «Что взять…» / «Чек-лист» | Accent border + checklist styling |
| Короткая строка без `.!?` | Subheading (h3) |

### Авто-охват (73 индексируемые статьи)

| Элемент | Секций/блоков |
|---------|---------------|
| FAQ accordion | ~54 статьи |
| Mistake callouts | 6 секций |
| Checklist styling | 5 секций + 38 parsed blocks |
| Tables | 3 |
| Bullet lists | 224 |
| Steps | 2 |
| Callouts (auto + manual) | 21+ |

---

## 4. Изменения layout / typography

- `ContentReadingLayout`: параметр `tocMinItems` (блог: **8** секций).
- `BlogPostView`: `content-reading-prose--wide`, spacing `space-y-10` между секциями.
- Section-images: слоты `section-1`, `section-2`, `section-3` (начало, середина, предпоследняя секция).
- `globals.css`: mobile font-size, spacing для callouts и wide prose.
- `BlogRelatedPosts`: заголовок **«Читайте также»**.
- `BlogRichArticle`: переиспользует `BlogCallout`, `BlogContentTable`, `BlogFaqSection`.
- `editorialArticle()`: join абзацев через `\n\n` вместо пробела.

---

## 5. Ручные правки (flagship, минимальные)

Без изменения смысла — только маркеры callout:

| Статья | Изменение |
|--------|-----------|
| `money-karty` | `**Совет:**` на абзац про запас 100–200 USD |
| `best-time-to-visit-argentina` | `**Важно:**` про сезон Патагонии |
| `patagonia-packing-list` | `**Что нужно знать:**` про погоду за день |
| `blue-dollar-argentina-2026` | `**Что нужно знать:**` про разницу карт/наличных |

---

## 6. По типам статей

### Section posts (~60)
- **До:** wall-of-text paragraphs.
- **После:** lists, checklists, tables, FAQ accordion, mistake callouts, subheadings — автоматически из существующей разметки `\n\n`.

### Rich national park guides (13)
- **До:** богатая вёрстка, изолированные компоненты.
- **После:** unified callout/table/FAQ components, тот же visual language.

### Checklist posts (`patagonia-packing-list`, `itinerary-чек-лист`)
- **До:** □ как plain text.
- **После:** `BlogChecklist` с иконками, accent border на секциях «Что взять».

---

## 7. A11y / mobile

- Callouts: `role="note"`, `aria-label`.
- FAQ: native `<details>` / keyboard-friendly.
- Tables: `overflow-x-auto`, `tabIndex={0}`, `min-width`, `scope="col"`.
- TOC mobile: collapsible `<details>` (без изменений, скрыт для коротких статей).
- Focus rings на FAQ summary.
- Font-size ≥ 1rem на mobile, line-height 1.7.

---

## 8. SEO (без изменений логики)

- `BlogFaqJsonLd` — по-прежнему из секций FAQ или rich `faq`.
- JSON-LD + styled FAQ UI теперь дополняют друг друга.

---

## 9. Verify

```
npx tsc --noEmit  → OK (21.06.2026)
```

Spot-check рекомендуется:
1. **Section:** `/blog/patagonia-packing-list` — checklists, subheadings
2. **Rich:** `/blog/natsionalnyy-park-iguasu` — gallery, callouts, FAQ
3. **FAQ + table:** `/blog/best-time-to-visit-argentina` — season table, FAQ accordion

---

## 10. Следующие шаги (не в scope)

- Добавить `blockType` в CMS-редактор для явной типизации секций.
- Season/budget widgets как typed blocks в rich-данных.
- Vitest-тесты для `parseBlogSectionBody`.

### Выполнено post-audit (21.06.2026)

- Слоты `section-2` / `section-3` в manifest для 25 статей с `section-1` (hero + inline).
- Исправлен join `post.content` через `\n\n` в `blog.ts`.
- Callout-маркеры на pillar: `argentina-tourist-visa-2026`, `buenos-aires-neighborhoods`, `mendoza-wine-route`.
- Удалены dead Unsplash hotlinks из `blog.ts` (hero через `getBlogPostCoverImage`).
- Дубликат gallery `place:puerto-madryn` — gallery-4 переназначен на hero Wikimedia.

---

## Синхронизация проекта

- **Новые поля:** не добавлялись в `BlogPost` — парсинг на лету.
- **Отображение:** все indexable section + rich posts через единую design system.
- **Редакция:** маркеры `**Совет:**` / `> [!tip]` можно добавлять точечно без рефакторинга текста.
- **Hubs / related:** `BlogRelatedPosts` + `relatedResources` в sidebar статьи.
