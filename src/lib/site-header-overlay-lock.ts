/** Suppress fixed site header while modal / fullscreen overlays are open. */

export const SITE_HEADER_OVERLAY_LOCK_EVENT = "site-header-overlay-lock-change";

let lockCount = 0;

function syncOverlayLockDataset() {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.siteOverlayLock = lockCount > 0 ? "locked" : "";
}

function dispatchOverlayLockChange() {
  if (typeof window === "undefined") return;
  syncOverlayLockDataset();
  window.dispatchEvent(
    new CustomEvent(SITE_HEADER_OVERLAY_LOCK_EVENT, { detail: lockCount }),
  );
}

export function isSiteHeaderOverlayLocked(): boolean {
  return lockCount > 0;
}

/** Call release when the overlay closes (typically via useEffect cleanup). */
export function acquireSiteHeaderOverlayLock(): () => void {
  lockCount += 1;
  dispatchOverlayLockChange();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    dispatchOverlayLockChange();
  };
}
