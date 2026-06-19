export const PWA_VISIT_COUNT_KEY = "pwa-visit-count";
export const PWA_INSTALL_DISMISS_KEY = "pwa-install-dismissed";

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
  return isIos && isSafari;
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function getPwaVisitCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(PWA_VISIT_COUNT_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export function incrementPwaVisitCount(): number {
  const next = getPwaVisitCount() + 1;
  try {
    window.localStorage.setItem(PWA_VISIT_COUNT_KEY, String(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function isPwaInstallDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PWA_INSTALL_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissPwaInstall(): void {
  try {
    window.localStorage.setItem(PWA_INSTALL_DISMISS_KEY, "1");
  } catch {
    /* ignore */
  }
}
