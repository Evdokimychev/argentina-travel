import {
  getQuickExplorePayloadCache,
  prefetchQuickExploreMapChunk,
  prefetchQuickExplorePayload,
  scheduleQuickExplorePrefetch,
} from "@/lib/quick-explore/client-cache";

export const SITE_MAP_OPEN_EVENT = "site-map:open";

/** Warm quick-explore API + map chunk before the user opens the dialog. */
export function prefetchQuickExploreMap(): void {
  if (typeof window === "undefined") return;
  if (getQuickExplorePayloadCache()) {
    prefetchQuickExploreMapChunk();
    return;
  }
  prefetchQuickExplorePayload();
}

export function openSiteMap(): void {
  if (typeof window === "undefined") return;
  prefetchQuickExploreMap();
  window.dispatchEvent(new CustomEvent(SITE_MAP_OPEN_EVENT));
}

export { scheduleQuickExplorePrefetch };
