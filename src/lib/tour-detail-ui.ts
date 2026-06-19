/** Общие поверхности и акценты страницы тура — sky / charcoal, как в шапке и каталоге. */
export const tourDetailSectionCardClass =
  "rounded-3xl border border-gray-100 bg-white p-5 shadow-card sm:p-6 md:p-8";

export const tourDetailInsetClass =
  "rounded-xl border border-sky/15 bg-gradient-to-br from-sky/[0.06] to-white";

export const tourDetailInsetMutedClass =
  "rounded-xl border border-sky/10 bg-sky/[0.04]";

export const tourDetailPromoPanelClass =
  "rounded-xl border border-sky/20 bg-sky/[0.05] px-4 py-3";

export const tourDetailSecondaryButtonClass =
  "rounded-2xl border border-sky/20 bg-white px-4 py-3.5 text-sm font-medium text-charcoal transition-colors hover:border-sky/40 hover:bg-sky/[0.06] disabled:cursor-wait disabled:opacity-70";

export const tourDetailTimelineClass = "bg-sky/20";

export const tourDetailDayBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky text-sm font-bold text-white shadow-sm sm:h-12 sm:w-12";

export const tourDetailAccentTextClass = "text-sky";

export const tourDetailPromoHeadingClass =
  "flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-dark";

export const tourDetailCalloutClass =
  "rounded-2xl border border-sky/15 bg-gradient-to-br from-sky/[0.06] to-white p-4";

export const tourDetailBadgeSkyClass =
  "rounded-full bg-sky/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky";

export const tourDetailCardBorderClass = "rounded-2xl border border-gray-100 bg-white shadow-sm";

/** Сетка hero-галереи на десктопе */
export const tourDetailGalleryGridClass =
  "hidden gap-2 md:grid md:grid-cols-4 md:grid-rows-2 md:aspect-[16/10] md:max-h-[min(52vw,520px)] md:w-full";

/** Карусель hero-галереи на мобильных */
export const tourDetailGalleryMobileAspectClass = "aspect-[4/3] sm:aspect-[16/10]";

/** Sticky-панель бронирования (десктоп) */
export const tourDetailStickyPanelClass =
  "lg:sticky lg:z-30 lg:self-start lg:overflow-y-auto";

/** Нижняя панель бронирования (мобильные) */
export const tourDetailMobileBarClass =
  "fixed bottom-0 left-0 right-0 z-40 border-t border-border-subtle bg-surface-elevated/95 shadow-elevated backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)] lg:hidden";

/** Вертикальный ритм между секциями страницы */
export const tourDetailSectionStackClass = "space-y-6 md:space-y-8";

/** Внутренние отступы контента секций (отзывы, программа) */
export const tourDetailContentStackClass = "space-y-4 sm:space-y-5";

/** Карточка отзыва */
export const tourDetailReviewCardClass =
  "rounded-card border border-border-subtle bg-surface-elevated p-4 shadow-card sm:p-5";

/** Фильтр / чип в секции отзывов */
export const tourDetailFilterChipClass =
  "rounded-full px-4 py-2 text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 sm:py-1.5";

/** Кнопка сворачивания секции на мобильных */
export const tourDetailSectionToggleClass =
  "flex min-h-[44px] w-full items-center justify-between gap-3 text-left md:min-h-0 md:cursor-default md:pointer-events-none";
