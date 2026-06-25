# Sprint 3 — Модальные окна, навигация, стабильность, производительность

**Дата:** 24.06.2026

## 1. Выполненные работы

### Модальные окна (единый `Dialog`)
- Mobile-first: **полный экран** (`100dvh`) на телефонах, центрированная панель с `sm+`
- **Кнопка закрытия 44×44px** по умолчанию (`showClose={true}`)
- **Back navigation**: `useDialogBackClose` — жест «назад» / browser back закрывает dialog
- Escape и overlay click — Radix (без изменений)
- Scroll внутри dialog: `overflow-y-auto`, `overscroll-contain`

### A11y booking/auth modals
- `DialogTitle` + `DialogDescription` (sr-only) в booking modals
- `CmsMediaPickerDialog` мигрирован на Radix Dialog (focus trap, Escape, overlay)
- Auth modal: `showClose={false}` + кастомная кнопка 44px (без дубля)

### Навигация (Sprint 2 carry-over + Sprint 3)
- Messages mobile master–detail + кнопка «Назад»
- Admin mobile nav sticky под header
- Route error retry (`retryRouteErrorHard`) на segment `error.tsx`

### Производительность
- Lazy-load `TravelpayoutsFlightsWidgets` в `TourFlightResultsModal` (dynamic import, `ssr: false`)
- Sprint 2: `overflow-x: clip`, `100dvw`, inline filters — снижение layout shift

## 2. Исправленные ошибки

| ID | Проблема | Решение |
|----|----------|---------|
| UX-001 | Popover под dialog в mobile filters | Inline accordion в sheet |
| UX-002 | Admin nav в конце страницы | Sticky + reorder DOM |
| UX-003 | WL calendar под tour modal | `#tpwl-modals` z-120 |
| UX-004 | Booking modals без DialogTitle | Radix Title/Description |
| UX-008 | Messages без mobile master–detail | Hide list / back button |
| MOD-001 | Dialog partial height на mobile | Fullscreen `100dvh` |
| MOD-002 | Нет back-to-close | `useDialogBackClose` |
| MOD-003 | CmsMediaPicker без focus trap | Radix Dialog |
| MOD-004 | Дубли close при showClose default | `showClose={false}` где свой header |

## 3. Оставшиеся проблемы

| Приоритет | Проблема |
|-----------|----------|
| High | Blog LCP/CLS (CI Lighthouse perf ~57) — hero aspect-ratio, image priority |
| High | `/about` — design system вместо публичной страницы |
| Medium | Admin ledger — card layout на `<md` |
| Medium | Единый z-index token file |
| Medium | Swipe-down to dismiss (не реализован — только back/Escape/кнопка) |
| Low | ~15 popover файлов с legacy `100vw` |
| Low | TourCheckoutModal — h2 вместо DialogTitle (крупный refactor) |

## 4. Рекомендации по Lighthouse / CWV

- Blog index: зарезервировать высоту hero, lazy below fold
- Tour detail: dynamic import WL уже на modal; рассмотреть для `/flights` page shell
- Bundle: `npm run build` + analyze `@next/bundle-analyzer` для admin CMS builder
