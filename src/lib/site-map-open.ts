import {
  getQuickExplorePayloadCache,
  prefetchQuickExploreMapChunk,
  prefetchQuickExplorePayload,
  scheduleQuickExplorePrefetch,
} from "@/lib/quick-explore/client-cache";
import { SITE_MAP_OPEN_EVENT } from "@/lib/site-map-events";

export { SITE_MAP_OPEN_EVENT };

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
