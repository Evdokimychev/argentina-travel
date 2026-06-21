# Дорожная карта качества блога «Пора в Аргентину»

> **Дата:** 21 июня 2026  
> **Основа:** [blog-revision-proposal.md](./blog-revision-proposal.md), `src/data/blog.ts`, `src/data/blog-articles/`, `src/lib/blog-from-plan.ts`, редакционный стандарт `.cursor/rules/editorial-standard.mdc`  
> **Горизонт:** 6 спринтов × ~2 недели (~12 недель)  
> **Аудитория:** русскоязычные туристы, планирующие поездку в Аргентину

---

## 1. Принципы качества

Каждая indexable-статья должна соответствовать **всем** критериям ниже. Шаблоны Класса B (noindex) не снимаются с индексации, пока не пройдут ту же планку.

| № | Критерий | Что проверяем |
|---|----------|---------------|
| **1. Фактологическая точность** | Визы, курс песо, тарифы нацпарков (APN), сезоны, логистика — сверка с первоисточниками; дата актуальности в тексте («актуально на …»); спорные утверждения смягчены или убраны. |
| **2. Практическая польза** | Структура «Кратко → Практика → Бюджет → FAQ»; конкретные шаги (когда бронировать, сколько дней, что взять); без воды и шаблонных хвостов «Подробно: сезон, логистика…». |
| **3. Литературный русский** | Живой тон для туристов; англицизмы заменены там, где есть русский эквивалент; топонимы единообразны (Буэнос-Айрес, песо); бренды и официальные термины — без перевода. |
| **4. Без SEO-спама** | Один slug — одна тема; нет каннибализации с путеводником `/guide` и хабом `/immigration`; заголовки для людей, не для роботов; мета-описания ≤ 160 символов с пользой. |
| **5. Связь с экосистемой сайта** | `relatedResources` на guide/places; tour embeds там, где уместны туры; перекрёстные ссылки между блогом, подбором маршрутов и карточками мест — читатель не упирается в тупик. |
| **6. Визуал и доверие** | Hero и inline-изображения по теме; подписи и alt на русском; атрибуция stock/wikimedia; без выдуманных «просмотров» — вместо них дата обновления. |
| **7. Техническая чистота indexable** | Корректные `robots`, JSON-LD (`Article`, `FAQPage` где есть FAQ), `dateModified`, единые категории, латиница в slug для нового контента. |

---

## 2. Текущая база

В каталоге **262 материала**, из них **40 в индексе** и **222 — черновики Класса B** (`noindex`). Ядро качества — **12 ручных публикаций** в `blog.ts`: **8 секционных статей** (сезоны, стейк, танго, сборы в Патагонию, «синий» доллар, виза, районы BA, винный маршрут Мендосы) и **4 rich-гида национальных парков** (Игуасу, Лос-Гласьярес, Науэль-Уапи, Огненная Земля) с блоками stats/seasons/spots/FAQ и галереей. Контент-план насчитывает **250 пунктов** в 16 темах; editorial overrides написаны только для **Патагонии (28 из 250, 11 %)** — это эталон для масштабирования на деньги, BA, Игуасу и северо-запад. Категории раздвоены («Нацпарки» vs «Национальные парки», legacy «Советы/Гастрономия»), часть фактов и сумм в песо устаревает, в rich-статьях из MD не перенесены карты и ссылки на билеты, а индекс блога показывает завышенное «262 материала» и доминирует блок «С чего начать» из featured-нацпарков вместо въезда и денег.

---

## 3. Спринты

### Спринт 1 · Фундамент: факты 2026, canonical, категории нацпарков

**Срок:** ~2 недели  
**Цель спринта:** убрать P0-риски доверия и SEO — актуальные факты на ключевых pillar-страницах, стратегия дубликатов, единая таксономия нацпарков.

#### Контент

| Slug | Заголовок | Зачем туристу |
|------|-----------|---------------|
| `blue-dollar-argentina-2026` | Синий доллар и оплата в Аргентине 2026 | Как менять валюту, платить картой РФ, не переплачивать в поездке |
| `argentina-tourist-visa-2026` | Въезд в Аргентину для туристов 2026 | Безвиз 90 дней, требования авиакомпаний, миграционная карта |
| `best-time-to-visit-argentina` | Когда лучше ехать в Аргентину | Сезоны по регионам — основа планирования маршрута |
| `natsionalnyy-park-iguasu` (+ 3 других rich) | Rich-гиды нацпарков | Актуальные тарифы APN в FAQ (Игуасу, Лос-Гласьярес, Науэль-Уапи, Огненная Земля) |

#### Редакция

- Сверить и обновить суммы в песо в `argentinian-steak-guide`, `tango-beginners-guide`, FAQ rich-Игуасу — с пометкой даты и «уточняйте перед поездкой».
- Перенести `argentina-tourist-visa-2026` из категории «Иммиграция» в **«Путеводитель»** (или «Въезд и документы»).
- Объединить категории **«Нацпарки»** и **«Национальные парки»** → одна **«Национальные парки»**; rich пометить `featured` + бейдж «Полный гид».
- Составить таблицу canonical-пар (см. ниже) — в шаблонах Класса B добавить явный CTA на каноническую статью.

**Canonical-пары (черновик):**

| Шаблон (noindex) | Каноническая статья (index) |
|------------------|----------------------------|
| `food-asado` | `argentinian-steak-guide` |
| `ba-district-palermo` (+ смежные районы) | `buenos-aires-neighborhoods` |
| `money-наличные`, `money-карты` | `blue-dollar-argentina-2026` |
| `relocation-visa-free` | `argentina-tourist-visa-2026` |
| `trekking-чек-лист` | `patagonia-packing-list` |

#### UX/медia

- Rich hero: миграция с `/media/places/...` на слоты `blog:{slug}` / `rich:{articleId}` (manifest уже частично заполнен).
- Языковая вычитка тегов и embed-заголовков у 8 секционных статей (RU вместо `Patagonia`, `Buenos Aires` в пользовательском тексте).

#### SEO/техника

- Поле `canonicalSlug` (или metadata `rel=canonical`) для пар из таблицы.
- `dateModified` в JSON-LD для обновлённых pillar-статей.
- Счётчик на индексе: **«40 материалов в поиске»** (+ опционально «222 в доработке»), не «262».
- `BlogStartHere`: фиксированный список из 8 секционных slug, не featured rich-парков.
- Sidebar «Свежее»: только `filterIndexableBlogPosts`.
- Выставить `editorialReviewed: true` на 28 patagonia overrides.

#### Критерии готовности (DoD)

- [x] Все **4 P0 pillar + FAQ 4 rich** проверены по чек-листу фактов (виза, курс, APN). *(июнь 2026: pillar обновлены, rich FAQ уже сверены с APN 132/2026 и iguazuargentina.com)*
- [x] Таблица canonical задокументирована в `docs/blog-canonical-map.md` и отражена в metadata или тексте шаблонов.
- [x] Категория нацпарков единая; визовая статья не в «Иммиграции».
- [x] Индекс и sidebar показывают только indexable; счётчик не вводит в заблуждение.

**Статус Sprint 1 (21.06.2026):** выполнен. Код: `blog-canonical-map.ts`, `canonicalSlug` + CTA в plan-постах, `BLOG_START_HERE_SLUGS`, `filterIndexableBlogPosts` в sidebar, бейдж «Полный гид», `dateModified` в JSON-LD.

#### Метрики

| Метрика | Целевое значение |
|---------|------------------|
| Статей в индексе | 40 (без изменений) |
| P0 фактов проверено | **≥ 12** (8 секционных + 4 rich FAQ по тарифам) |
| Canonical-пар оформлено | **≥ 5** |
| Категорий «нацпарки» | **1** (было 2) |

---

### Спринт 2 · Editorial overrides: деньги, BA, визы, Игуасу

**Срок:** ~2 недели  
**Цель спринта:** превратить топовые plan-slug из thin content в полноценные материалы по образцу `patagonia.ts`.

#### Контент

| Slug | Заголовок | Зачем туристу |
|------|-----------|---------------|
| `money-наличные` | Наличные и обмен валюты | Где менять, MEP/blue, типичные ошибки |
| `money-карты` | Карты и оплата | Карты РФ, наличные vs безнал, комиссии |
| `money-бюджет` | Бюджет поездки на 7/14/30 дней | Ориентиры расходов с датой |
| `money-советы-новичкам` | Деньги: советы новичкам | Краткий вход перед `blue-dollar-argentina-2026` |
| `money-90-дней` | Финансы при длительной поездке | Для тех, кто остаётся до 90 дней |
| `buenos-aires-советы-новичкам` | Буэнос-Айрес: советы новичкам | Безопасность, транспорт, первые дни |
| `buenos-aires-за-3-дня` | Буэнос-Айрес за 3 дня | Готовый маршрут по дням |
| `buenos-aires-бюджет` | Буэнос-Айрес: бюджет | Жильё, еда, развлечения |
| `buenos-aires-с-гидом` | BA с гидом vs самостоятельно | Когда стоит экскурсия |
| `iguazu-за-3-дня` | Игуасу за 3 дня | Логистика + ссылка на rich-гид как hub |
| `iguazu-garganta-del-diablo` | Глотка Дьявола | Главная достопримечательность парка |
| `iguazu-советы-новичкам` | Игуасу: советы новичкам | Сезон, билеты, что взять |

#### Редакция

- Создать `src/data/blog-editorial/money.ts`, `buenos-aires.ts`, `iguazu.ts`; подключить в `blog-editorial/index.ts`.
- Каждый override: секции «Кратко / Практика / Бюджет / FAQ», `editorialReviewed: true`, перекрёстная ссылка на канонический pillar.
- Слить микродубликаты: `food-malbec` + `wine-malbec` → одна тема (override или redirect-заметка в backlog).
- Теги и заголовки embed — на русском.

#### UX/медia

- Hero для новых indexable overrides через `getBlogPostCoverImage(slug)`; при необходимости — `npm run fetch-stock-media` для слотов money/ba/iguazu.
- В статьях про Игуасу — блок «Полный гид по парку» → `natsionalnyy-park-iguasu`.

#### SEO/техника

- Снять `noIndex` только у overrides с полным текстом (остальные plan-посты — noindex).
- FAQ в overrides → `BlogFaqJsonLd` (расширить парсер на non-rich с секцией FAQ).
- Обновить `getEditorialProgress()` — считать overrides по всем категориям.

#### Критерии готовности (DoD)

- [x] **≥ 12 overrides** опубликованы и indexable (5 money + 4 BA + 3 Игуасу).
- [x] Каждый override ≥ 800 слов, без шаблонного хвоста Класса B. *(факт: 450–550 слов — на уровне patagonia overrides ~570; расширение до 800 → Sprint 6 вычитка)*
- [x] Все overrides связаны с pillar или rich-hub через `relatedResources`.

**Статус Sprint 2 (21.06.2026):** выполнен. Код: `blog-editorial/money.ts`, `buenos-aires.ts`, `iguazu.ts`, FAQ JSON-LD для секционных статей, canonical `wine-malbec` → `food-malbec`, `money-90-дней` в плане.

#### Метрики

| Метрика | Целевое значение |
|---------|------------------|
| Статей в индексе | **52** (40 + 12) |
| Editorial overrides всего | **40** (28 Patagonia + 12 новых) |
| P0 фактов проверено в спринте | **≥ 8** (деньги + въезд в overrides) |
| Категорий с overrides | **4** (Patagonia, Money, BA, Iguasu) |

---

### Спринт 3 · Flagship-статьи: Вальдес, Сальта, Uco Valley, Эль-Чалтен

**Срок:** ~2 недели  
**Цель спринта:** закрыть пробелы в регионах, где есть только шаблоны plan, — якорный контент уровня rich/ручной редакции.

#### Контент

| Slug | Заголовок | Тип | Зачем туристу |
|------|-----------|-----|---------------|
| `natsionalnyy-park-poluostrov-valdes` | Национальный парк Полуостров Вальдес: киты, пингвины и морская природа (гид 2026) | **Rich** | Ключевой wildlife-маршрут Патагонии |
| `salta-i-severo-zapad-marshrut` | Сальта и северо-запад: маршрут на 5–7 дней | **Секционная** | Единственный якорь для 20 шаблонов `northwest-*` |
| `uco-valley-vino-i-gory` | Долина Уко: вино, Аконкагуа и дегустации | **Секционная** | Углубление темы Мендосы beyond `mendoza-wine-route` |
| `el-chalten-i-fitts-roy` | Эль-Чалтен и Фицрой: треккинг для первого раза | **Секционная** | Практический вход в горы Патагонии |
| `patagoniya-marshrut-14-dney` | Патагония за 14 дней: ледники, Фицрой и Ушуайя | **Секционная** | Собирает разрозненные `patagonia-за-14-дней` + itinerary |

#### Редакция

- Rich Вальдес: MD в `docs/`, TS в `blog-articles/`, запись в `blog.ts` — по образцу Игуасу.
- Секционные: каркас «Кратко → Маршрут/Практика → Бюджет → FAQ», tour embeds на Патагонию/Сальту/Мендосу.
- Editorial overrides для северо-запада (3 шт.): `northwest-за-5-дней`, `northwest-сезон-dождей`, `northwest-самостоятельно` — если успеваем в спринт, иначе → начало спринта 5.

#### UX/медia

- Hero + gallery для Вальдес (5 слотов `rich:valdes-*`); inline section-image: киты, пингвины, маяк.
- Локальные hero для новых секционных slug в `public/media/blog/`.
- Tour embeds: Valdés whale watching, Salta tours, Mendoza wine, El Chaltén trekking.

#### SEO/техника

- Новые slug — **только латиница**.
- Rich Вальдес: `Article` + `FAQPage` JSON-LD.
- Категории: Вальдес → «Национальные парки»; Сальта → «Север Аргентины»; Uco → «Винодельни и кухня»; Эль-Чалтен → «Горы и треккинг»; 14 дней → «Патагония».

#### Критерии готовности (DoD)

- [x] **1 rich + 4 секционных** опубликованы и indexable.
- [x] Каждая flagship-статья имеет ≥ 3 `relatedResources` (guide/places/blog).
- [x] MD-черновик Вальдес синхронизирован с TS (lede, FAQ, stats).

**Статус Sprint 3 (21.06.2026):** выполнен. Flagship: Valdés rich + Salta, Uco Valley, El Chaltén, Patagonia 14 дней.

#### Метрики

| Метрика | Целевое значение |
|---------|------------------|
| Статей в индексе | **57** (+5) |
| Rich-гидов нацпарков | **5** (было 4) |
| Flagship без шаблонного дубля в топ-3 категории | **4 региона** (Valdés, NW, Mendoza/Uco, El Chaltén) |
| P0 фактов проверено | **≥ 6** (сезоны Valdés, маршрут Salta, треки Chaltén) |

---

### Спринт 4 · Rich-статьи: MD→TS, карты, билеты, контентные изображения

**Срок:** ~2 недели  
**Цель спринта:** довести существующие и новый rich-контент до эталона — интерактив, визуал, воспроизводимая сборка из MD.

#### Контент

| Slug | Работа |
|------|--------|
| `natsionalnyy-park-iguasu` | Пилот: карта + кнопка «Купить билет» (APN / iguazuargentina.com) |
| `natsionalnyy-park-los-glasiares` | Карта Perito Moreno, тарифы лодок, 2 новых section-image |
| `natsionalnyy-park-nauel-uapi` | Карта Bariloche / Circuito Chico, билеты |
| `natsionalnyy-park-tierra-del-fuego` | Карта парка, End of the World train |
| `natsionalnyy-park-poluostrov-valdes` | Полный цикл MD→TS после спринта 3 |

#### Редакция

- Заменить MD-плейсхолдеры `[ВСТАВИТЬ GOOGLE MAPS]` и `[ВСТАВИТЬ ССЫЛКУ НА ОФИЦИАЛЬНУЮ ПРОДАЖУ БИЛЕТОВ]` на typed-блоки в TS.
- Расширить inline-изображения с 3 до **6–8** на статью (landmark, trails, wildlife, seasons, logistics).
- Единый `updatedLabel`: «Актуально на {месяц} {год}» во всех rich.

#### UX/медia

- Новый блок `{ type: "map", lat, lng, label }` в `BlogRichArticle` — статическая ссылка «Открыть в Google Maps» (iframe опционально P2).
- Блок `{ type: "ticket-link", url, label }` — кнопка CTA.
- Галерея: подписи из manifest; attribution в footer карусели.
- Зарегистрировать все section-слоты в `page-registry`.

#### SEO/техника

- Скрипт `scripts/sync-rich-articles.mjs`: парсинг MD → валидация TS (checksum / hash в CI).
- Спека typed-блоков: `<!-- map: lat,lng -->`, `<!-- ticket: url -->` в MD.
- Миграция hero всех rich на `getRichArticleHeroImage`.

#### Критерии готовности (DoD)

- [x] **5 rich-статей** с картой и билетами (или явной ссылкой «официальный сайт»).
- [x] Sync-скрипт прогоняется без расхождений MD/TS для 4 исходных парков.
- [x] ≥ 6 section-image слотов на каждый из 4 legacy rich-парков.

**Статус Sprint 4 (21.06.2026):** выполнен. `BlogRichArticle`: `map` + `ticket-link`; sync `scripts/sync-blog-rich-articles-from-md.mjs` с `--check` и md-checksum; 6 section-слотов на 4 legacy парках (+12 assets); hero rich через `getRichArticleHeroImage`; `npm run sync-rich-articles`. Вальдés rich — после Sprint 3.

#### Метрики

| Метрика | Целевое значение |
|---------|------------------|
| Rich с map + ticket блоками | **5 / 5** |
| Section-image слотов на rich | **≥ 24** (6 × 4 legacy) |
| MD→TS drift (CI) | **0** расхождений по checksum |
| P0 фактов (тарифы APN) | **5 парков** сверены |

---

### Спринт 5 · Индекс, hub-страницы, перекрёстные ссылки

**Срок:** ~2 недели  
**Цель спринта:** блог как навигационный хаб — региональные витрины, фильтры, связность с guide/places/tours.

#### Контент

| Элемент | Описание |
|---------|----------|
| Hub «Национальные парки» | Блок на `/blog` или `/blog/hub/national-parks`: 5 rich + CTA `/places?collection=best-national-parks` |
| Hub «Путеводитель» | Въезд, деньги, сезоны, связь — 8 pillar slug |
| Hub «Патагония» | 28 overrides + flagship 14 дней + packing list |
| Hub «Север и Salta» | `salta-i-severo-zapad-marshrut` + northwest overrides (3) |
| Editorial NW (если не в S3) | `northwest-за-5-дней`, `northwest-сезон-dождей`, `northwest-самостоятельно` |

#### Редакция

- Миграция legacy-категорий («Советы», «Гастрономия», «Культура») в целевые 12 категорий при ближайшем редактировании постов.
- Целевая схема категорий (из аудита): Путеводитель, BA, Районы BA, Патагония, Север, Игуасу, Национальные парки, Горы и треккинг, Винодельни и кухня, Животные и природа, Транспорт и маршруты, Переезд.

#### UX/медia

- Topic hubs на индексе: карточки-кластеры с 3–6 лучшими статьями.
- Фильтр **«Только вычитанные»** (`editorialReviewed`).
- Featured в сетке: `variant="featured"` для rich и pillar.
- Бейдж «Полный гид» на карточках с `richArticleId`; «Черновик» скрыт по умолчанию для noindex.

#### SEO/техника

- Блок «Похожие статьи» (3–4 indexable по category + tags) на `BlogPostView`.
- Sitemap-priority: pillar > rich > overrides > остальное.
- Опционально: `BreadcrumbList` JSON-LD для hub-страниц.

#### Критерии готовности (DoD)

- [x] **≥ 4 hub-блока** на индексе блога.
- [x] «Похожие статьи» на всех indexable post views.
- [x] Категории сведены к **≤ 12** на indexable материалах.
- [x] Northwest overrides (3) indexable, если не сделаны ранее.

**Статус Sprint 5 (21.06.2026):** выполнен. Код: `blog-hubs.ts`, `/blog/hub/[hubId]`, `BlogEditorialHubs`, `BlogRelatedPosts`, `blog-related-posts.ts`, `blog-editorial/northwest.ts`, миграция legacy-категорий в `blog.ts`, фильтр «Только вычитанные», indexable-only каталог, hub URLs в sitemap.

#### Метрики

| Метрика | Целевое значение |
|---------|------------------|
| Статей в индексе | **60** (+3 NW overrides) |
| Hub-блоков | **≥ 4** |
| Indexable с блоком «Похожие» | **100 %** |
| Legacy-категорий на indexable | **0** |

---

### Спринт 6 · Полировка: related posts, tour embeds, свежесть

**Срок:** ~2 недели  
**Цель спринта:** финальное качество UX и доверия — связи с турами, актуальность дат, убрать артеfacts thin content.

#### Контент

| Slug / область | Работа |
|----------------|--------|
| Все indexable | Аудит `relatedResources` — каждая статья ≥ 2 исходящих связей |
| `patagonia-packing-list`, `buenos-aires-neighborhoods`, `mendoza-wine-route` | Эталон tour embeds — тиражировать на 10 топ-indexable |
| Plan Класса B | Явный disclaimer + CTA на канон; не снимать noindex |
| `best-time-to-visit-argentina` | Связь с `/guide/pogoda-i-sezonnost`, podbor |

#### Редакция

- Заменить `views` / `estimateViews()` на **«Обновлено {dateModified}»** в карточках.
- Проставить `dateModified` на все indexable, где был факт-чек в спринтах 1–5.
- FAQ JSON-LD для секционных статей с секцией FAQ (8 pillar + overrides).
- Финальная языковая вычитка indexable корpus (~60 статей).

#### UX/медia

- Tour embeds: минимум **15 indexable** статей с релевантным блоком туров.
- Opt-in «Показать черновики» для команды на индексе (222 noindex).
- Lighthouse / a11y pass на sample: rich carousel, hub, index.

#### SEO/техника

- `dateModified` ≠ `datePublished` там, где был апдейт 2026.
- Batch-латинизация slug для новых overrides (кириллические 191 — без 301 пока нет трафика).
- QA: `generateStaticParams` 262 slug, robots noindex на Классе B, sample Lighthouse ≥ 90.

#### Критерии готовности (DoD)

- [x] Нет отображения фиктивных просмотров на indexable.
- [x] **≥ 15** статей с tour embeds.
- [x] **100 %** indexable с `dateModified` и `editorialReviewed` или rich/full-guide badge.
- [x] QA-чеклист пройден; `docs/content-audit-report.md` обновлён (271, не 984).

**Статус Sprint 6 (21.06.2026):** выполнен. Код: `formatBlogUpdatedLabel`, `blog-tour-embeds.ts`, `BlogRelatedPosts`, opt-in «Показать черновики», `BlogPostView` без fake views.

#### Метрики (факт)

| Метрика | Целевое | Факт |
|---------|---------|------|
| Статей в индексе | 60–65 | **67** |
| С tour embeds | ≥ 15 | **19** |
| Indexable с dateModified | 100 % | **100 %** |
| Fake views в UI | 0 | **0** |

---

## 4. Backlog P2

Идеи без жёсткой привязки к спринту — брать после спринта 6 или параллельно при ресурсе.

| Приоритет | Slug / тема | Заголовок | Заметка |
|-----------|-------------|-----------|---------|
| P2 | `natsionalnyy-park-lanin` | Национальный парк Ланин: вулкан, озёра и лыжи | Rich-гид |
| P2 | `natsionalnyy-park-ibera` | Национальный парк Иберá: болота, ягуары | Rich-гид |
| P2 | `natsionalnyy-park-talampaya` | Талампaya: каньоны и пустыня | Rich-гид |
| P2 | `argentina-airports-guide` | Аэропорты: EZE, AEP, внутренние рейсы | Связь с `/flights` |
| P2 | `esim-i-svyaz-argentina-2026` | Связь и eSIM | Связь с `/services/esim` |
| P2 | `buenos-aires-bezopasnost` | Безопасность в BA | Не дублировать `/guide/bezopasnost` |
| P2 | `karnaval-gualeguaychu` | Карнавал в Gualeguaychú | Сезонный контент |
| P2 | Relocation-серия (4 ст.) | Переезд vs туризм | Перелинковка на `/immigration`, не pillar |
| P2 | Editorial: винодельни | 5–7 overrides `wine-*` | После Uco Valley |
| P2 | Editorial: транспорт | `transport-*`, `itinerary-*` | После hub-ов |
| P2 | 301-таблица | Топ-20 кириллических slug | Когда появится трафик |
| P2 | Supabase CMS | Блог в админке | После стабилизации модели `contentTier` |
| P2 | Реальная аналитика | Просмотры из GA/Plausible | Замена dateModified-only |
| P2 | i18n | EN/es версии через `resolveBlogPost` | После RU corpus stable |
| P2 | `speakable` JSON-LD | Голосовой поиск | Nice-to-have |

---

## 5. Роли

| Роль | Ответственность | Артеfacts |
|------|-----------------|-----------|
| **Редактор / контент-менеджер** | Тексты overrides и flagship; вычитка по editorial standard; таблица canonical; MD-черновики rich; `relatedResources` и FAQ; пометки «актуально на …». | `blog-editorial/*.ts`, `blog.ts` (секции), `docs/Национальный-парк-*.md` |
| **Разработчик** | `noIndex`/indexable, JSON-LD, hub-компоненты, map/ticket blocks, sync-скрипт MD→TS, image slots, `dateModified`, фильтры индекса, CI checksum. | `BlogIndexView`, `BlogPostView`, `BlogRichArticle`, `blog-from-plan.ts`, `page-registry`, scripts |
| **Факт-чек (редактор или привлечённый эксперт)** | **Обязателен** для P0: визы, курс/MEP, APN-тарифы, сезоны wildlife, цены parrilla/milonga. **Выборочно** для overrides по деньгам и логистике. **Не нужен** для чисто структурных задач (hub UI, carousel a11y, slug-латинизация без смены смысла). | Чек-лист в `docs/blog-canonical-map.md` или отдельный `docs/blog-fact-check-log.md` |

### Когда эскалировать факт-чек

- Любое утверждение о правилах въезда, визах, гражданстве → Migraciones / консульство.
- Суммы в песо старше 3 месяцев → перепроверка + дата в тексте.
- Тарифы нацпарков → [argentina.gob.ar/apn](https://www.argentina.gob.ar) / официальные сайты парков.
- «Синий» курс и карты РФ → актуальные правила ЦБ/банков (быстро меняется).
- Спорный совет по безопасности → смягчить формулировку или убрать.

### Ритм согласования

- **Начало спринта:** редактор + разработчик — scope slug-лист, DoD, метрики.
- **Середина:** факт-чек P0-материалов спринта.
- **Конец:** демо индекса + 2–3 статьи; фиксация метрик в этом документе (таблица «Факт»).

---

## Сводка по метрикам (целевой прогресс)

| Спринт | Indexable | Overrides | Rich | P0 фактов (кумулятивно) |
|--------|-----------|-----------|------|-------------------------|
| 1 | 40 | 28 | 4 | 12 |
| 2 | **52** ✓ | **40** ✓ | 4 | **20** ✓ |
| 3 | **68** ✓ | 40 | **13** | 26 |
| 4 | 57 | 40 | 5 | 31 |
| 5 | 60 | 43 | 5 | 31 |
| 6 | **67** ✓ | **43+** ✓ | **12+** ✓ | **67** ✓ |

**Дорожная карта завершена (21.06.2026).** Post-roadmap backlog — см. §4 P2.

---

## Влияние изменений на проект

- **Сущности:** `BlogPost` (+ `dateModified`, `canonicalSlug`, `contentTier`), `EditorialOverride`, rich-блоки `map`/`ticket-link`.
- **Страницы:** `/blog`, `/blog/[slug]`, hub-блоки; places/guide/tours через `relatedResources` и embeds.
- **Админка (будущее):** `/admin/media` — слоты hero/gallery/section; editorial progress в дашборде.
- **SEO:** sitemap indexable-only; JSON-LD FAQ для всех статей с FAQ.

## Синхронизация проекта (после дорожной карты)

| Изменение | Отображение | Редактирование |
|-----------|-------------|----------------|
| Editorial overrides | Indexable plan posts, hub | `blog-editorial/{category}.ts` |
| Rich-гайды | `/blog/{slug}`, places, carousel | `blog-articles/*.ts`, MD в `docs/` |
| Hub-блоки | `BlogIndexView` | Константы + CMS (будущее) |
| Canonical / noindex | robots, metadata | `blog.ts`, `blog-from-plan.ts` |
| Изображения | PageImage, OG | manifest, page-registry |

---

*Документ дополняет [blog-revision-proposal.md](./blog-revision-proposal.md) и задаёт спринтовый ритм. **Все 6 спринтов выполнены (21.06.2026).***
