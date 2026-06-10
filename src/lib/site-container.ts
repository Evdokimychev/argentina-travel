/** Контентные страницы — центрированная колонка */
export const siteContainerClass = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

/** Хедер и full-bleed полосы — на всю ширину окна с боковыми отступами */
export const siteViewportInsetClass = "w-full px-4 sm:px-6 lg:px-8";

/** Fixed-кнопки у левого края окна (поиск) */
export const floatingChromeInsetClass = "left-4 sm:left-6 lg:left-8";

export { siteScrollAnchorClass } from "@/lib/scroll-anchor";

/** Sticky TOC на hub-страницах — ниже хедера и section nav */
export const hubTocStickyTopClass =
  "top-[calc(var(--site-header-height,72px)+var(--site-section-nav-height,0px)+1rem)]";

export const hubTocStickyMaxHeightClass =
  "max-h-[calc(100vh-var(--site-header-height,72px)-var(--site-section-nav-height,0px)-2rem)]";
