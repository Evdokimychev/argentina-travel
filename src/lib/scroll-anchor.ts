/** Extra gap below sticky chrome when scrolling to in-page anchors */
export const SITE_SCROLL_ANCHOR_GAP_PX = 16;

export const siteScrollAnchorClass = "site-scroll-anchor-target";

function readCssPx(name: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

/** Offset for scroll targets: header + section nav(s) + gap */
export function getSiteScrollAnchorOffset(): number {
  return (
    readCssPx("--site-header-height", 80) +
    readCssPx("--site-section-nav-height", 0) +
    readCssPx("--tour-section-nav-height", 0) +
    SITE_SCROLL_ANCHOR_GAP_PX
  );
}

export function scrollToSiteAnchor(id: string, behavior: ScrollBehavior = "smooth"): void {
  const target = document.getElementById(id);
  if (!target) return;

  const offset = getSiteScrollAnchorOffset();
  const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);

  window.scrollTo({ top, behavior });

  const hash = `#${id}`;
  if (window.location.hash !== hash) {
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
  }
}
