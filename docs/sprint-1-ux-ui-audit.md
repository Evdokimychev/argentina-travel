# Sprint 1 — Полный UX/UI аудит и карта проблем

**Проект:** «Пора в Аргентину» (`goargentina.ru`)  
**Дата:** 24.06.2026  
**Охват:** 120 маршрутов (`src/app/**/page.tsx`) + модальные потоки (авторизация, бронирование, поиск билетов)  
**Метод:** инвентаризация маршрутов, статический аудит вёрстки/CSS/компонентов, сверка с e2e visual smoke и контент-аудитами, проверка z-index/stacking и паттернов кабинетов

### Контрольные ширины

| Устройство | Ширина | Tailwind |
|------------|--------|----------|
| Mobile | 375–430 px | `< md` |
| Tablet | 768–1024 px | `md`–`lg` |
| Desktop | ≥ 1280 px | `lg+` |

### Легенда приоритетов

| Уровень | Критерий |
|---------|----------|
| **Critical** | Блокирует задачу, ломает навигацию/формы, недоступно с клавиатуры/скринридера, контент вне экрана без возможности прокрутки |
| **High** | Существенно ухудшает UX на одном из breakpoints; частые сценарии (каталог, бронирование, кабинет) |
| **Medium** | Заметно, но обходимо; вторичные экраны или редкие состояния |
| **Low** | Косметика, микро-отступы, улучшения polish |

---

## 1. Карта экранов (охват аудита)

| Область | Маршрутов | Ключевые пути | Shell / layout |
|---------|-----------|---------------|----------------|
| Публичные | 78 | `/`, `/tours`, `/tours/[slug]`, `/blog/*`, `/destinations/*`, `/flights`, `/excursions/*`, `/guide/*`, `/immigration/*` | `SiteChrome` + `Header` |
| Авторизация | 1 + modal | `/?auth=sign-in`, `/auth/reset-password` | `AuthModal`, `AuthContext` |
| ЛК туриста | 10 | `/profile`, `/profile/bookings`, `/profile/favorites`, `/profile/settings` | `ProfileShell` |
| Кабинет организатора | 18 | `/organizer`, `/organizer/tours`, `/organizer/bookings`, редактор тура | `OrganizerShell` |
| Админ-панель | 29 | `/admin`, `/admin/marketplace/*`, `/admin/operations/*`, `/admin/system/*` | `AdminShell` |
| Бронирование | 5 | `/booking/find`, `/booking/pay/[token]`, `/trip/[token]` | `SiteChrome` |
| Embed | 2 | `/embed/tours`, `/embed/flights/wl` | без header/footer |
| Ошибки | 9 | `not-found`, `global-error`, segment `error.tsx` | по контексту |

**Примечание:** все маршруты дублируются с префиксами `/es/` и `/en/` (middleware rewrite).

---

## 2. Сводка по severity

| Уровень | Кол-во | Типичные зоны |
|---------|--------|---------------|
| Critical | 5 | Мобильные фильтры каталога, модалка билетов WL, админ-навигация, a11y диалогов |
| High | 12 | Z-index stack, сообщения, таблицы кабинетов, mega menu, popover 100vw |
| Medium | 14 | Touch targets, sticky nav, flight modal overlap, изображения |
| Low | 8 | Toast/progress поверх модалок, calendar cells, polish |

---

## 3. Critical

### UX-001 — Фильтры каталога на mobile: popover под overlay диалога

| | |
|---|---|
| **Страница** | `/tours`, `/excursions` (мобильная панель «Фильтры») |
| **Файлы** | `CatalogFiltersSheet.tsx`, `FilterBar.tsx`, `ui/popover.tsx` (z-110), `ui/dialog.tsx` (z-115) |
| **Симптом** | В sheet «Фильтры каталога» выпадающие панели (даты, цена, регион) не кликабельны или скрыты под затемнением |
| **Причина** | `FilterBar` использует `FilterPopover` → Radix Popover порталится в `body` с `z-[110]`, а Dialog overlay/content — `z-[115]` |
| **Исправление** | На mobile в sheet рендерить фильтры inline (accordion), без portaled popover; либо поднять popover до `z-[120]` только внутри dialog context; то же для `ExcursionCatalogFiltersSheet.tsx` |

---

### UX-002 — Админ: мобильная навигация в конце страницы

| | |
|---|---|
| **Страница** | Все `/admin/*` на mobile/tablet |
| **Файлы** | `AdminShell.tsx` (L95 — `AdminMobileNav` после `<main>`) |
| **Симптом** | Горизонтальное меню разделов появляется только после прокрутки всей страницы; на длинных таблицах навигация «теряется» |
| **Причина** | DOM-порядок: nav после content; нет `sticky`/`fixed` (в отличие от `OrganizerShell` с bottom nav) |
| **Исправление** | Перенести `AdminMobileNav` сразу после `AdminMobileHeader`; `sticky top-[var(--site-header-full-height)] z-30 backdrop-blur`; добавить `cabinetMobileBottomInsetClass` при переходе на bottom bar |

---

### UX-003 — Модалка поиска билетов на туре: календарь WL под overlay

| | |
|---|---|
| **Страница** | `/tours/[slug]` → «Найти билеты» → модалка |
| **Файлы** | `TourFlightResultsModal.tsx`, `flights-whitelabel-widget.css` (L100–113 — стили `#tpwl-modals` только для `.flights-page-root`) |
| **Симптом** | Календарь/пассажиры Travelpayouts не видны или обрезаны; клики не доходят |
| **Причина** | Partner layer `#tpwl-modals` не получает z-index/positioning в контексте tour modal (`z-[116]`) |
| **Исправление** | Добавить `body:has(.tour-flight-modal-scroll) > #tpwl-modals { z-index: 120; … }`; расширить `ensureTpwlModalsInteractive()` для modal mount |

---

### UX-004 — Checkout и booking-модалки без Radix DialogTitle

| | |
|---|---|
| **Страница** | Карточка тура → бронирование; экскурсии; shop |
| **Файлы** | `TourCheckoutModal.tsx`, `ExcursionBookingModal.tsx`, `PartnerTourBookingModal.tsx`, `ShopCheckoutModal.tsx` |
| **Симптом** | VoiceOver/NVDA не объявляет имя диалога; фокус-менеджмент Radix неполный |
| **Причина** | Вместо `<DialogTitle>` используется `<h2 id="…">` |
| **Исправление** | Заменить на `<DialogTitle>` (+ `<DialogDescription className="sr-only">`); единый паттерн для всех booking modals |

---

### UX-005 — Горизонтальный скролл страницы из-за `100vw` в mega menu

| | |
|---|---|
| **Страница** | Все страницы с header (desktop mega menu) |
| **Файлы** | `mega-menu-section-content.tsx` — `w-[min(calc(100vw-2rem),64rem)]` |
| **Симптом** | 1–16 px горизонтального скролла `body` на Windows/Linux при открытом mega menu |
| **Причина** | `100vw` включает ширину scrollbar gutter |
| **Исправление** | `100dvw` или привязка к `siteContainerClass`; `overflow-x: clip` на `html` как safety net |

---

## 4. High

### UX-006 — Z-index: toast и progress bar поверх модалок

| **Страница** | Глобально |
| **Файлы** | `RouteProgressBar.tsx` z-130, `SiteToastHost.tsx` z-120, `dialog.tsx` z-115 |
| **Причина** | Разрозненные magic numbers |
| **Исправление** | Единая шкала в `tokens.css`; при `html[data-site-overlay-lock="locked"]` понижать toast/progress |

---

### UX-007 — Mega menu (z-110) выше mobile drawer (z-60)

| **Страница** | Header, resize tablet → mobile |
| **Файлы** | `MegaMenuDropdown.tsx`, `SiteNavDrawer.tsx` |
| **Причина** | Mega menu использует dialog-tier z-index |
| **Исправление** | Mega menu z-55; при открытии drawer закрывать mega menu |

---

### UX-008 — Сообщения: нет mobile master–detail

| **Страница** | `/profile/messages`, `/organizer/messages` |
| **Файлы** | `MessagesInboxView.tsx` |
| **Симптом** | На mobile список и чат в одной колонке; «Выберите диалог слева» под длинным списком |
| **Исправление** | `< lg`: скрывать список при выбранном thread; кнопка «Назад к списку» |

---

### UX-009 — Таблицы организатора: scroll wrapper без min-width

| **Страница** | `/organizer/payments`, `/organizer/bookings` |
| **Файлы** | `OrganizerPaymentsView.tsx`, `OrganizerBookingsView.tsx` (`min-w-[920px]` есть в bookings, нет в payments) |
| **Симптом** | Ячейки с `whitespace-nowrap` вылезают за card без горизонтальной прокрутки |
| **Исправление** | `min-w-[720px]` на `<Table>` + проверка всех finance views |

---

### UX-010 — CMS media picker: самодельный dialog без focus trap

| **Страница** | `/admin/content/documents/[id]`, редактор CMS |
| **Файлы** | `CmsMediaPickerDialog.tsx` |
| **Причина** | `role="dialog"` без Radix, без Escape, без trap |
| **Исправление** | Миграция на `ui/dialog.tsx` |

---

### UX-011 — Popover шириной `calc(100vw-2rem)` на главной и в поиске

| **Страница** | `/`, `/tours`, `/flights`, форма сложного маршрута на туре |
| **Файлы** | `HomeFlightSearchBlock.tsx`, `SearchBlock.tsx`, `TourFlightComplexSearchForm.tsx` |
| **Симптом** | Popover выступает за padding контейнера → микро-скролл |
| **Исправление** | `max-w-[min(580px,calc(100dvw-2rem))]`; width от trigger через CSS variable |

---

### UX-012 — Админ: контент без `siteContainerClass`

| **Страница** | Все `/admin/*` |
| **Файлы** | `AdminShell.tsx` vs `OrganizerShell.tsx` |
| **Симптом** | На ultra-wide таблицы и формы растягиваются без max-width |
| **Исправление** | Обернуть `<main>` в `siteContainerClass` или `max-w-screen-2xl mx-auto` |

---

### UX-013 — Tour flight modal: negative overlap обрезает результаты

| **Страница** | `/tours/[slug]` flight modal |
| **Файлы** | `tour-flight-modal.css` — `margin-top: -3.75rem` |
| **Симптом** | На 375px блок `#tpwl-tickets` частично под hero/кнопкой закрытия |
| **Исправление** | `<640px`: уменьшить overlap; `padding-top` на results mount |

---

### UX-014 — GuideAssistantWidget перекрывает mobile booking bar

| **Страница** | `/guide/*`, карточки тура/экскурсии |
| **Файлы** | `GuideAssistantWidget.tsx` z-88 vs `MobileBookingBar` z-40 |
| **Исправление** | Offset `bottom` при наличии booking bar; z-index ~45 |

---

### UX-015 — Блог: тяжёлые LCP/CLS в CI Lighthouse

| **Страница** | `/blog`, `/blog/natsionalnyy-park-iguasu`, hub-страницы |
| **Источник** | CI Lighthouse (median perf 57, CLS до 0.94 на index) |
| **Причина** | Hero/gallery без reserved height; late layout shift |
| **Исправление** | `aspect-ratio` на hero; skeleton; lazy below fold; проверить 500 на отдельных slug |

---

### UX-016 — `/about` показывает Design System вместо страницы «О проекте»

| **Страница** | `/about` |
| **Источник** | Контент-аудит `docs/audit/audit-goargentina-etap-1.md` (G — about) |
| **Симптом** | Пользователь видит внутреннюю витрину компонентов |
| **Исправление** | Заменить контент на публичную страницу «О проекте»; design system только на `/dev/design-system` |

---

### UX-017 — Несколько booking modals без DialogDescription

| **Страница** | Каталог (dates modal), auth |
| **Файлы** | `TourDepartureDatesModal.tsx`, `CatalogFiltersSheet.tsx`, `AuthModal.tsx` |
| **Исправление** | Добавить `DialogDescription` (visible или sr-only) |

---

## 5. Medium

### UX-018 — Touch targets < 44px (кластер)

| Страница | Компонент | Размер | Файл |
|----------|-----------|--------|------|
| Модалки | Close button | ~28px (`p-1`) | `TourWaitlistModal`, `ExcursionBookingModal`, `TourPriceRequestModal` |
| Каталог | Filter scroll chevrons | 32px (`h-8 w-8`) | `FilterScrollRow.tsx` |
| Каталог | View toggle | 32×36px | `CatalogToolbar.tsx` |
| ЛК туриста | Mobile nav pills | ~30px | `ProfileSidebar.tsx` |
| Организатор | Bottom nav icons | 28px | `OrganizerSidebar.tsx` |
| Сообщения | Send button | icon-only | `MessagesInboxView.tsx` |
| Toast | Dismiss | 28px | `SiteToastHost.tsx` |

**Исправление:** стандарт `min-h-11 min-w-11` для icon buttons; variant `size="icon"` в design system.

---

### UX-019 — Profile mobile nav не sticky

| **Страница** | `/profile/*` |
| **Файлы** | `ProfileShell.tsx`, `cabinetMobileNavClass` |
| **Исправление** | `sticky top-[var(--site-header-full-height)] z-30` |

---

### UX-020 — Organizer editor: sticky tabs под header

| **Страница** | `/organizer/tours/[id]/edit` |
| **Файлы** | `OrganizerTourEditorView.tsx` |
| **Исправление** | `siteStickyBelowHeaderInsetClass` + согласованный `top` offset |

---

### UX-021 — WL widget `overflow: visible` на root

| **Страница** | `/flights`, tour flight modal |
| **Файлы** | `flights-whitelabel-widget.css` |
| **Исправление** | Scope `overflow: visible` только на search form; results в `overflow-x-auto` |

---

### UX-022 — Catalog sticky bar `-mx-4` bleed

| **Страница** | `/tours` |
| **Файлы** | `CatalogStickyBar.tsx` |
| **Исправление** | `overflow-x-clip` на `catalog-listing-page-root` |

---

### UX-023 — Изображения `fill` без `sizes` в редакторе

| **Страница** | Organizer tour editor |
| **Файлы** | `TourGuideCreateModal.tsx`, `TourAccommodationPlaceEditor.tsx` |
| **Исправление** | Contextual `sizes` (`"96px"`, `"120px"`) |

---

### UX-024 — Rich-text таблицы в туре/программе

| **Страница** | `/tours/[slug]` — программа, описание партнёра |
| **Файлы** | `ItinerarySection.tsx` (есть `[&_table]:overflow-x-auto`) |
| **Риск** | Nested tables в partner HTML могут выходить за card |
| **Исправление** | Глобальный `.rich-text-editor-content table { display: block; overflow-x: auto }` уже частично есть — расширить на partner sections |

---

### UX-025 — Карта тура: popup на mobile

| **Страница** | `/tours/[slug]` — RouteMap |
| **Файлы** | `RouteMap.tsx`, `globals.css` (`.route-map-popup-body`) |
| **Риск** | Leaflet popup шире viewport на узких экранах |
| **Исправление** | `max-width: calc(100dvw - 2rem)` на popup content |

---

### UX-026 — Auth modal: subtitle не связан с DialogDescription

| **Страница** | `/?auth=sign-in` |
| **Файлы** | `AuthModal.tsx` |
| **Исправление** | Обернуть подсказки в `DialogDescription` |

---

### UX-027 — Excursion / tour gallery lightbox z-100

| **Страница** | Деталки с галереей |
| **Файлы** | `TourDetailGallery.tsx`, `BlogRichGalleryCarousel.tsx` |
| **Риск** | Lightbox z-100 ниже некоторых WL/modal слоёв при одновременном открытии |
| **Исправление** | Единый `z-modal-lightbox` tier |

---

### UX-028 — FilterBar скрыт на mobile — единственный вход sheet (см. UX-001)

| **Страница** | `/tours` |
| **Файлы** | `ToursCatalog.tsx` L231 — `hidden lg:block` |
| **Исправление** | Sprint 2: dedicated mobile filter UX (не desktop FilterBar в sheet) |

---

### UX-031 — Admin payment ledger 1100px без card fallback

| **Страница** | `/admin/operations/payments` |
| **Файлы** | `AdminPaymentLedgerView.tsx` |
| **Исправление** | Card layout на `<md` или sticky first column |

---

## 6. Low

| ID | Страница | Проблема | Исправление |
|----|----------|----------|-------------|
| UX-032 | Global | Toast dismiss 28px | `h-10 w-10` |
| UX-033 | Date pickers | Calendar day cells 32px | `h-10 w-10` на touch |
| UX-034 | `/tours` card | Dates modal без sr-only description | `DialogDescription` |
| UX-035 | Map popups | `MapObjectPopup` без DialogTitle | Radix title |
| UX-036 | Footer | Длинные legal links wrap unevenly на 320px | `flex-wrap gap-2` audit |
| UX-037 | `/podbor` | Fixed bottom CTA bar + safe area | Проверить overlap с iOS home indicator |
| UX-038 | Dark mode | Частичное покрытие partner WL styles | Extend dark tokens в WL CSS |
| UX-039 | `/forum` | Таблица/списки threads — density на mobile | Card view fallback |

---

## 7. Матрица «страница × breakpoint» (приоритет ручной QA)

Статический аудит покрывает все маршруты; **ручная проверка в браузере** (375 / 768 / 1280) рекомендована для:

| Приоритет | Страницы | Фокус |
|-----------|----------|-------|
| P0 | `/tours`, `/tours/patagonia-glaciers`, tour flight modal | Фильтры, booking bar, WL modal |
| P0 | `/admin` (bookings, payments), `/organizer/bookings` | Таблицы, mobile nav |
| P1 | `/`, `/flights`, `/blog`, `/blog/[rich-guide]` | Popover, LCP, tables in article |
| P1 | `/profile/bookings`, `/profile/messages` | Cards, inbox layout |
| P2 | `/excursions`, `/destinations`, `/guide` | Filters sheet, section nav scroll |
| P2 | `/booking/pay/[token]`, `/?auth=sign-in` | Forms, keyboard, modal a11y |

E2e visual baseline (`tests/e2e/visual-smoke.spec.ts`): `/`, `/tours`, `/tours/patagonia-glaciers`, `/blog/*`, `/destinations/patagonia`, `/mapa-argentina`, `/immigration`, `/gallery`.

---

## 8. Сквозные системные проблемы

1. **Z-index без единого источника** — значения 40–130 разбросаны по компонентам; нужен `--z-*` contract и lint rule.
2. **Dialog a11y** — ~8 modals используют visual `h2` вместо Radix Title/Description.
3. **`100vw` vs scrollbar** — mega menu, popovers, flight search; миграция на `dvw` / container queries.
4. **Mobile cabinet nav** — три shell (profile, organizer, admin) с разным поведением; унифицировать sticky/bottom patterns.
5. **Touch targets** — design system button sizes не enforce 44px minimum на mobile.
6. **Partner embeds (WL, maps)** — z-index и overflow требуют context-specific CSS (`flights-page` vs `tour-flight-modal`).

---

## 9. Рекомендуемый Sprint 2 (по impact)

| # | Задача | Закрывает |
|---|--------|-----------|
| 1 | Mobile filter sheet без portaled popovers | UX-001, UX-028 |
| 2 | `#tpwl-modals` stacking в tour flight modal | UX-003, UX-013 |
| 3 | Admin mobile nav sticky + reorder DOM | UX-002, UX-005 |
| 4 | DialogTitle/Description pass (booking + auth) | UX-004, UX-010, UX-017, UX-026 |
| 5 | Z-index token file + overlay lock integration | UX-006, UX-007, UX-030 |
| 6 | Messages mobile master–detail | UX-008 |
| 7 | Touch target standard (44px) in UI kit | UX-018 |
| 8 | `100vw` → `100dvw` in mega menu + popovers | UX-005, UX-011 |
| 9 | `/about` public page | UX-016 |
| 10 | Blog LCP/CLS (hero aspect-ratio) | UX-015 |

---

## 10. Связанные документы

- `docs/audit/audit-etap-2-svodka.md` — контент и доверие (пересекается с UX на `/about`, каталог туров)
- `docs/blog-content-ux-audit.md` — блог section/rich rendering (частично закрыто)
- `docs/audit/audit-etap-2-razdel-5-tury.md` — туры (контент + карточки)
- `tests/e2e/visual-smoke.spec.ts` — baseline screenshots

---

*Отчёт сгенерирован в рамках Sprint 1. Следующий шаг — Sprint 2: исправление Critical + High по таблице §9.*
