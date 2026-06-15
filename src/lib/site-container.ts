/** Контентные страницы — центрированная колонка */
export const siteContainerClass = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

/** Хедер и full-bleed полосы — на всю ширину окна с боковыми отступами */
export const siteViewportInsetClass = "w-full px-4 sm:px-6 lg:px-8";

export { floatingChromeInsetClass } from "@/lib/floating-chrome-button";

export { siteScrollAnchorClass } from "@/lib/scroll-anchor";

/** Sticky TOC на hub-страницах — ниже хедера и section nav */
export const hubTocStickyTopClass =
  "top-[calc(var(--site-header-height,72px)+var(--site-section-nav-height,0px)+1rem)]";

export const hubTocStickyMaxHeightClass =
  "max-h-[calc(100vh-var(--site-header-height,72px)-var(--site-section-nav-height,0px)-2rem)]";

/** Sticky sidebar (бронирование и т.п.) — ниже хедера и таб-навигации разделов */
export const siteStickyPanelTopClass =
  "top-[calc(var(--site-header-height,72px)+var(--site-section-nav-height,0px)+var(--tour-section-nav-height,0px)+1rem)]";

export const siteStickyPanelMaxHeightClass =
  "max-h-[calc(100vh-var(--site-header-height,72px)-var(--site-section-nav-height,0px)-var(--tour-section-nav-height,0px)-2rem)]";
