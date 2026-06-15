export const SITE_SEARCH_OPEN_EVENT = "site-search:open";

export function openSiteSearch() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SITE_SEARCH_OPEN_EVENT));
}
