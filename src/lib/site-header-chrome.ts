/** Shared site header layout + auto-hide chrome (fixed header, spacer, sticky offsets). */

/** Always keep the header visible within this distance from the top. */
export const SITE_HEADER_TOP_REVEAL_PX = 48;
/** Never hide before the user scrolls past this offset. */
export const SITE_HEADER_MIN_HIDE_SCROLL_PX = 96;
/** Cumulative downward distance required before hiding (feels like "after a moment"). */
export const SITE_HEADER_HIDE_DISTANCE_PX = 72;
/** Cumulative upward distance required before revealing again. */
export const SITE_HEADER_REVEAL_DISTANCE_PX = 8;

export const SITE_HEADER_CHROME_CHANGE_EVENT = "site-header-chrome-change";

/** Conservative spacer height before React measures the real header. */
export function estimateSiteHeaderFullHeightPx(viewportWidth = 0): number {
  return viewportWidth >= 768 ? 140 : 84;
}

function dispatchSiteHeaderChromeChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SITE_HEADER_CHROME_CHANGE_EVENT));
}

/**
 * Sync CSS vars for fixed header + document spacer.
 * Spacer always keeps full height; only transform hides the header visually.
 * `--site-header-height` drives sticky offsets (0 when hidden).
 */
export function applySiteHeaderChrome(fullHeightPx: number, visible: boolean): number {
  if (typeof document === "undefined") return 0;

  const root = document.documentElement;
  const fullNum = Math.max(0, Math.round(fullHeightPx));
  const full = `${fullNum}px`;

  root.style.setProperty("--site-header-full-height", full);
  root.style.setProperty("--site-header-height", visible ? full : "0px");
  root.dataset.siteHeader = visible ? "visible" : "hidden";

  dispatchSiteHeaderChromeChange();
  return window.scrollY;
}

export function bootstrapSiteHeaderChrome(): void {
  if (typeof document === "undefined") return;
  const width = window.innerWidth || 0;
  applySiteHeaderChrome(estimateSiteHeaderFullHeightPx(width), true);
}
