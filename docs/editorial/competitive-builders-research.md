# Исследование: WP Travel Engine и готовые системы конструкторов

**Дата:** 25 июля 2026  
**Контекст:** «Пора в Аргентину» уже использует Payload-подобный page builder на Supabase. Задача — не писать с нуля, а осознанно переносить **опыт** (модель данных, банк блоков/паттернов, UX), а не PHP-код WordPress.

---

## 1. Что такое WP Travel Engine на самом деле

Это не «просто тема», а экосистема:

| Слой | Роль |
|------|------|
| **WP Travel Engine (плагин)** | CPT «Trip», поля тура, бронирование, цены, даты, taxonomies |
| **Gutenberg Trip Blocks (20+)** | Блоки **страницы тура**, которые **читают данные тура**, а не хранят весь текст внутри блока |
| **Pattern Engine** | Банк готовых **паттернов и starter pages** (Design Library → Import) |
| **FSE templates** | Шаблоны single trip / archive / search / taxonomy |
| **Elementor Widgets (аддон)** | Тот же каталог сущностей для Elementor + готовый single-trip template |
| **Travel Monster / TravelVerse** | Темы + starter sites |
| **Pro add-ons** | Advanced Itinerary, Fixed Starting Dates, Reviews, Partial Payment, Extra Services… |

Официальные источники:

- [Blocks, Patterns & Templates](https://docs.wptravelengine.com/article/wp-travel-engine-blocks-patterns-templates/)
- [Pattern Engine](https://docs.wptravelengine.com/article/pattern-engine/)
- [Trip Blocks (маркетинг)](https://wptravelengine.com/trip-blocks/)

### Каталог Single Trip Blocks (ядро / pro)

**Контент тура (data-bound):**

- Trip Booking (цена, скидка, CTA, highlights)
- Trip Duration
- Trip Description
- Trip Highlights
- Trip Facts
- Trip Gallery
- Cost Includes / Cost Excludes
- Trip FAQs
- Trip Itinerary (+ Altitude Chart — pro)
- Trip Map
- Trip Enquiry
- Tab Block (вкладки: overview / itinerary / …)
- Fixed Starting Dates (pro)
- Ratings / Reviews Count / Stars Bar / Review Form (pro)

**Паттерны отзывов:** Aggregate Reviews, Average Ratings, Review List.

Ключевая идея WTE (и то, что мы уже частично скопировали интуитивно):

> **Редактор тура = структурированные поля сущности.**  
> **Редактор страницы = компоновка блоков, многие из которых — «окна» в поля тура.**

То есть `Trip Itinerary Block` не заставляет редактора заново набирать программу в Gutenberg — он **отображает** itinerary из Trip Settings. Меняется **раскладка и оформление**, не дублируются данные.

---

## 2. Что у нас уже сделано «как у них»

В `docs/visual-page-builder-architecture.md` прямо зафиксирован паттерн **WordPress Patterns / Elementor Kits**.

| WTE | Наш аналог | Статус |
|-----|------------|--------|
| Gutenberg block registry | `PAGE_BUILDER_BLOCKS` + editorial registry | ✓ |
| Pattern Engine / section kits | `PAGE_BUILDER_PATTERNS` (tour-intro, practical-guide, day-by-day…) | ✓ частично |
| FSE single-trip template | `TourDetailView` + секции (`ItinerarySection`, `IncludedExcludedSection`, …) | ✓ как код, не как CMS layout |
| Trip Facts | `facts-grid` | ✓ редакционный |
| Trip FAQs | `faq` / `accordion` | ✓ |
| Trip Gallery | `gallery` + variants | ✓ |
| Cost Includes/Excludes | `checklist` / `pros-cons` + tour `IncludedExcludedSection` | ✓ раздельно |
| Trip Itinerary | `steps` + tour `ItinerarySection` (богаче, с картой дня) | ✓ на карточке тура |
| Trip Booking CTA | `tour-booking` embed | ✓ |
| Trip Map / route | `map`, `route-map` | ✓ |
| Enquiry form | lead / booking forms (отдельный контур) | ✓ иначе |
| Design Library import | starter patterns в пустом документе | ✓ упрощённо |
| Autosave / revisions | Phase 3A autosave + `content_revisions` | ✓ |
| Variant / style controls | Phase 3B variant/density в карточках | ✓ |

**Вывод:** редакционный Page Builder у нас уже ближе к WTE Blocks+Patterns, чем кажется. Слабое место — **не отсутствие банка компонентов**, а разрыв между:

1. **CMS page builder** (статьи, гайды, лендинги) — гибкий JSON-блоки;
2. **Tour detail** — мощный React-shell, но **не собирается из CMS-блоков** как FSE single-trip template.

Именно этот разрыв WTE закрывает Gutenberg Trip Blocks + FSE.

---

## 3. Что из WTE стоит перенести как опыт (не код)

### 3.1. Высокий приоритет (ближайшие итерации)

1. **Data-bound tour layout blocks**  
   Блоки вида «программа тура», «включено/не включено», «даты выезда», «цена+CTA», «факты тура», которые в editor preview показывают live-данные выбранного `tourSlug`, а на публичной стороне рендерят существующие секции из `tour-detail/*`.  
   *Не копировать PHP Gutenberg — обернуть уже написанные React-секции в page-builder contract.*

2. **Tab shell для карточки тура** (аналог WTE Tab Block)  
   Overview / Program / Includes / FAQ / Reviews как переключаемые панели — у многих туров UX уже близкий; вынести в явный layout-паттерн + опционально CMS override порядка вкладок.

3. **Design Library UX**  
   Pattern Engine: кнопка «Библиотека» → Patterns / Pages → Import.  
   У нас есть starter patterns; не хватает **каталога с превью** (скрин/схема) и импорта **целой страницы** (landing templates: «хаб направления», «кампания сезона»).

4. **Reviews / social proof patterns**  
   Aggregate ratings + list + form — у нас отзывы есть в других местах; для tour/page builder полезны готовые **композиции** (не только одиночный блок).

### 3.2. Средний приоритет

5. **Fixed starting dates presentation** — у нас scheduled dates уже в booking; нужен **презентационный** блок списка дат (не только в сайдбаре бронирования).  
6. **Itinerary altitude / day media** — Advanced Itinerary Builder: день + фото + meals + sleep. Частично есть в itinerary days; можно усилить editor организатора, не CMS статьи.  
7. **Archive / search composition** — WTE FSE для archive; у нас каталог туров кастомный — CMS modules для homepage/marketplace важнее, чем FSE archive.

### 3.3. Низкий приоритет / не переносить

- Elementor / Divi совместимость — другой стек.  
- WooCommerce checkout — у нас свой booking + партнёры (Tripster/YouTravel).  
- PHP Gutenberg package as dependency — несовместим с Next.js.  
- Полная замена нашего builder на WordPress — откат архитектуры.

---

## 4. Другие готовые системы (что изучать вместо «с нуля»)

### React page builders (наш стек)

| Система | Лицензия | Зачем смотреть | Риск для нас |
|---------|----------|----------------|--------------|
| **[Puck](https://puckeditor.com)** (`@puckeditor/core`) | MIT | Визуальный DnD над **вашими** React-компонентами, JSON output, Next.js recipes | Другая JSON-модель → адаптер или параллельный lane для landing/homepage |
| **BlockNote** | MPL/MIT | Slash-menu, Notion-like UX для **абзацев** | Не замена travel-блоков; только inline text |
| **Tiptap** | MIT (+ Pro) | Inline rich text внутри `paragraph` | Уже в roadmap Phase 2b |
| **Editor.js** | Apache-2 | Простые JSON blocks | Слабее экосистема React 19; мы уже ушли дальше |
| **Payload CMS Blocks / Lexical** | MIT | Эталон schema→admin→render | Полный Payload runtime не нужен; паттерн уже заимствован |

**Рекомендация по Puck:** не выкидывать текущий builder. Пилот — **только homepage / landing visual lane** с адаптером `Puck JSON → наши renderers` **или** наоборот обёртка существующих блоков как Puck components. Решение — после spike 1–2 дня, не «внедрить целиком завтра».

### Travel booking WP-плагины (только продуктовый опыт)

| Плагин | Чем полезен как референс |
|--------|---------------------------|
| **WP Travel Engine** | Trip blocks + Pattern Engine + FSE — главный референс layout |
| **Tourfic** | Hotels+tours+cars на Woo; UX каталога и фильтров |
| **Tour Master** | Классический tour theme stack (Envato) — карточки, itinerary UI |
| **Yatra** | Более лёгкий operator-first booking |

Их код в наш репозиторий **не подключаем**. Смотрим: информационную архитектуру карточки тура, набор секций, паттерны «банк → импорт → правка».

### Headless / commercial builders

| Система | Заметка |
|---------|---------|
| **Builder.io / Plasmic** | Быстрый visual, но vendor lock-in и лишняя зависимость для RU-first editorial CMS |
| **Sanity + Presentation** | Сильный live preview; дороже по миграции модели |
| **Directus / Strapi** | CMS-ядро; мы уже на Supabase |

Для текущего продукта: **остаёмся на Supabase + свой registry**; опыт берём из WTE/Puck/BlockNote.

---

## 5. Матрица пробелов (наш site vs WTE)

| Возможность | WTE | Мы | Действие |
|-------------|-----|----|----------|
| Банк editorial-блоков | Gutenberg + patterns | `PAGE_BUILDER_BLOCKS` + patterns | Расширять, не переписывать |
| Банк **trip** layout-блоков | 20+ data-bound | TourDetailView hardcoded | **Ввести tour layout blocks / slots** |
| Design Library с превью | Pattern Engine | Starter patterns без галереи | UI «Библиотека шаблонов» |
| Стили блока (цвет, отступы) | Gutenberg style controls | variant/density | Достаточно для brand; не копировать полный theme.json |
| Reviews patterns | 4 patterns | Разрозненно | Паттерн `reviews-social-proof` |
| Homepage composition | Patterns/pages | Modules strip planned | CMS modules (уже в Phase 3C) |
| Visual WYSIWYG canvas | Gutenberg/Elementor | Fields + Preview toggle | Опциональный Puck-пилот для landing |
| Booking engine | Woo/native | Свой + партнёры | Не трогать |

---

## 6. Практический план переноса опыта (без «с нуля»)

### Итерация A — Tour layout как банк компонентов (самый ценный урок WTE)

1. Зафиксировать контракт `TourLayoutBlock` / slots на `TourDetailView`:  
   `booking-panel`, `itinerary`, `includes-excludes`, `facts`, `gallery`, `faq`, `dates-list`, `enquiry`.  
2. Реализации = **существующие** компоненты из `src/components/tour-detail/*`.  
3. Опционально: CMS override порядка секций для native tours (JSON layout), default = текущий порядок.

### Итерация B — Design Library

1. UI каталога паттернов с превью (даже статичные скриншоты/схемы).  
2. Разделение: **Sections** (как сейчас) / **Page templates** (landing packs).  
3. Импорт копирует блоки (как WTE Import) — уже так устроены patterns.

### Итерация C — Editor UX (не новый движок)

1. Slash-menu для paragraph (Tiptap/BlockNote **только** для текста).  
2. Не мигрировать storage на BlockNote/Puck без адаптера.  
3. Spike Puck 48h: 5 layout-компонентов на одном `/landing` draft → go/no-go.

### Итерация D — Social proof & dates presentation

1. Паттерн отзывов (aggregate + list).  
2. Блок «ближайшие даты» для страниц туров/лендингов (data from tour API).

---

## 7. Чего делать не нужно

1. Ставить WordPress / WTE рядом «чтобы было».  
2. Переписывать Page Builder на Puck целиком без адаптера.  
3. Дублировать itinerary и в CMS-блоках статьи, и в полях тура без data-binding.  
4. Копировать WooCommerce-модель оплаты.  
5. Гнаться за количеством блоков WTE — важнее **data-bound** и **библиотека шаблонов**.

---

## 8. Итог для владельца продукта

WP Travel Engine ценен не как код, а как **проверенная продуктовая схема**:

1. **Сущность тура** со структурированными полями.  
2. **Банк блоков**, многие из которых — проекции этих полей.  
3. **Банк паттернов/страниц** с однокнопочным импортом.  
4. **Шаблон single trip**, который редактор собирает без разработчика.

У «Пора в Аргентину» пункты 1 и частично 2–3 уже есть (особенно в editorial CMS). Главный недобор относительно WTE — **сделать карточку тура и маркетинговые страницы таким же «банком компонуемых компонентов»**, переиспользуя уже написанный React, а не изобретая Gutenberg заново.

Puck / BlockNote / Tiptap — инструменты **ускорения UX редактора**, не замена travel-домена и не замена Tripster/YouTravel.

---

## Ссылки для следующего spike

- WTE blocks docs: https://docs.wptravelengine.com/article/wp-travel-engine-blocks-patterns-templates/  
- Pattern Engine: https://docs.wptravelengine.com/article/pattern-engine/  
- Puck: https://github.com/puckeditor/puck  
- Наш registry: `src/lib/cms/page-builder/block-registry.ts`  
- Наши patterns: `src/lib/cms/page-builder/pattern-registry.ts`  
- Tour shell: `src/components/tour-detail/TourDetailView.tsx`
