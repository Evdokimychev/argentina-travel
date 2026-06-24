"use client";

import { useEffect, useState } from "react";
import {
  acquireSiteHeaderOverlayLock,
  isSiteHeaderOverlayLocked,
  SITE_HEADER_OVERLAY_LOCK_EVENT,
} from "@/lib/site-header-overlay-lock";

/** Hide the fixed site header while `active` is true. */
export function useSiteHeaderOverlayLock(active = true): void {
  useEffect(() => {
    if (!active) return;
    return acquireSiteHeaderOverlayLock();
  }, [active]);
}

/** Subscribe to global overlay lock state (for Header chrome). */
export function useSiteHeaderOverlayLocked(): boolean {
  const [locked, setLocked] = useState(() =>
    typeof window !== "undefined" ? isSiteHeaderOverlayLocked() : false,
  );

  useEffect(() => {
    const sync = () => setLocked(isSiteHeaderOverlayLocked());
    sync();
    window.addEventListener(SITE_HEADER_OVERLAY_LOCK_EVENT, sync);
    return () => window.removeEventListener(SITE_HEADER_OVERLAY_LOCK_EVENT, sync);
  }, []);

  return locked;
}
