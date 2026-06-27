/** Контентные страницы — центрированная колонка */
export const siteContainerClass =
  "mx-auto w-full max-w-7xl overflow-x-clip px-4 sm:px-6 lg:px-8";

/** Каталог и главная — шире на больших экранах (1440–1920px) */
export const siteCatalogContainerClass =
  "mx-auto w-full max-w-screen-2xl overflow-x-clip px-4 sm:px-6 lg:px-8";

/** Хедер и full-bleed полосы — на всю ширину окна с боковыми отступами */
export const siteViewportInsetClass = "w-full px-4 sm:px-6 lg:px-8";

export { floatingChromeInsetClass } from "@/lib/floating-chrome-button";

export { siteScrollAnchorClass } from "@/lib/scroll-anchor";

export const siteHeaderOffsetTransitionClass =
  "transition-[top] duration-300 ease-out motion-reduce:transition-none";

/** Sticky элемент сразу под хедером — top синхронизирован с auto-hide */
export const siteStickyBelowHeaderClass =
  `top-[var(--site-header-height,72px)] ${siteHeaderOffsetTransitionClass}`;

/** Sticky элемент с отступом 1rem под хедером */
export const siteStickyBelowHeaderInsetClass =
  `top-[calc(var(--site-header-height,72px)+1rem)] ${siteHeaderOffsetTransitionClass}`;

/** Sticky элемент с отступом 0.75rem под хедером (редактор тура) */
export const siteStickyBelowHeaderInset075Class =
  `top-[calc(var(--site-header-height,72px)+0.75rem)] ${siteHeaderOffsetTransitionClass}`;

/** Sticky TOC на hub-страницах — ниже хедера и section nav */
export const hubTocStickyTopClass =
  `top-[calc(var(--site-header-height,72px)+var(--site-section-nav-height,0px)+1rem)] ${siteHeaderOffsetTransitionClass}`;

export const hubTocStickyMaxHeightClass =
  "max-h-[calc(100vh-var(--site-header-height,72px)-var(--site-section-nav-height,0px)-2rem)]";

/** Sticky reading sidebar: один блок на колонку, прокрутка внутри при длинном TOC */
export const readingAsideStickyScrollClass =
  `sticky space-y-4 overflow-y-auto overscroll-y-contain scrollbar-thin touch-pan-y ${hubTocStickyTopClass} ${hubTocStickyMaxHeightClass}`;

/** Sticky sidebar (бронирование и т.п.) — ниже хедера и таб-навигации разделов */
export const siteStickyPanelTopClass =
  `top-[calc(var(--site-header-height,72px)+var(--site-section-nav-height,0px)+var(--tour-section-nav-height,0px)+1rem)] ${siteHeaderOffsetTransitionClass}`;

export const siteStickyPanelMaxHeightClass =
  "max-h-[calc(100vh-var(--site-header-height,72px)-var(--site-section-nav-height,0px)-var(--tour-section-nav-height,0px)-2rem)]";

/** Минимальная высота контента кабинета — полная высота хедера, без auto-hide */
export const siteShellMinHeightClass =
  "min-h-[calc(100vh-var(--site-header-full-height,72px))]";
