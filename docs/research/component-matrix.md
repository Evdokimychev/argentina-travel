# Матрица компонентов

| Потребность | Компонент проекта | Статус | Примечание |
|---|---|---|---|
| Button / IconButton | `ui/button`, круглые icon controls | Есть | 44 px на touch |
| Badge / TrustBadge | `ui/badge`, partner/trust banners | Есть | Семантические цвета |
| Rating | `ReviewRatingBadge` | Есть | New state без фиктивного рейтинга |
| Price | `TourPublicPriceDisplay`, `FormattedPrice` | Есть | Старая цена, from, request |
| DateRange | `BookingDateSelector`, `DateRangePicker` | Есть | URL и booking context |
| Avatar / OrganizerBadge | `SafeImage`, organizer cards | Есть | Нейтральный fallback |
| SearchBar | `SearchBlock`, `HomeMultiSearch` | Есть | Mobile stacked layout |
| FilterChip / FilterGroup | `CatalogActiveFilterChips`, feature filters | Есть | Активные значения и clear |
| FilterDrawer | `CatalogFiltersSheet` | Улучшен | Draft, reset, result count |
| SortSelect | `CatalogToolbar` | Есть | Pills + overflow mask |
| TourCard | `MarketplaceTourCard` | Улучшен | Компактный mobile layout |
| TourCardSkeleton | `CatalogLoadingFallback`, skeleton primitives | Есть | Без layout shift |
| ArticleCard | `BlogCard` | Есть | Теги и чтение |
| GuideCard | expert/organizer public components | Есть | Trust и CTA |
| Gallery | `TourDetailGallery`, shared lightbox/mosaic | Улучшен | Swipe, стрелки, Escape, закрытие по свободному фону |
| Modal / Drawer | `ui/dialog`, `PartnerTourBookingModal` | Есть | Focus trap и close |
| Accordion | `ItinerarySection`, `TourTermsAccordion` | Есть | `aria-expanded` |
| Tabs | section nav и tab primitives | Есть | Горизонтальная прокрутка на mobile |
| BookingPanel | `TourSidebar`, `TourBookingPanel` | Есть | Sticky desktop |
| MobileBookingBar | `MobileBookingBar` | Есть | Safe-area + cookie offset |
| Empty / Error | `CatalogEmptyResults`, route errors | Есть | Следующее действие |
| Breadcrumbs | `PageBreadcrumbs` | Улучшен | Compact mobile trail |
| Pagination / LoadMore | `CatalogLazyLoadFooter` | Есть | Авто + явная кнопка |
| SectionHeader | `TourSection`, section headers | Есть | Единая иерархия |

Новая параллельная дизайн-система не создавалась: улучшения встроены в существующие primitives и feature-компоненты.
