import { getYandexMetrikaCounterId } from "@/lib/analytics/yandex-metrika-config";
import { hasAnalyticsConsent } from "@/lib/cookie-consent";

declare global {
  interface Window {
    ym?: YandexMetrikaFn;
    __goArgentinaYmInited?: boolean;
    /** Set by head bootstrap after the first pageview hit is queued. */
    __goArgentinaYmFirstHitSent?: boolean;
    [key: `yaCounter${number}`]: unknown;
  }
}

type YandexMetrikaInitOptions = {
  defer: boolean;
  clickmap: boolean;
  trackLinks: boolean;
  accurateTrackBounce: boolean;
  webvisor: boolean;
  trackHash: boolean;
  /** Enables form analytics and yacounter*inited readiness event. */
  triggerEvent: boolean;
};

type YandexMetrikaHitOptions = {
  title?: string;
  referer?: string;
};

type YandexMetrikaFn = {
  (counterId: number, method: "init", options: YandexMetrikaInitOptions): void;
  (counterId: number, method: "hit", url: string, options?: YandexMetrikaHitOptions): void;
  (counterId: number, method: "reachGoal", goal: string, params?: Record<string, unknown>): void;
  (counterId: number, method: "destruct"): void;
  a?: unknown[];
  l?: number;
};

export const YANDEX_METRIKA_INIT_OPTIONS: YandexMetrikaInitOptions = {
  defer: true,
  clickmap: true,
  trackLinks: true,
  accurateTrackBounce: true,
  webvisor: true,
  trackHash: true,
  triggerEvent: true,
};

export const YANDEX_METRIKA_TAG_JS = "https://mc.yandex.ru/metrika/tag.js";

/** Load the counter only after explicit analytics consent. */
export function ensureYandexMetrikaLoader(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (typeof window.ym !== "function") {
    const queue = function (...args: unknown[]) {
      queue.a = queue.a ?? [];
      queue.a.push(args);
    } as YandexMetrikaFn;
    queue.l = Date.now();
    window.ym = queue;
  }
  if (!document.querySelector(`script[src="${YANDEX_METRIKA_TAG_JS}"]`)) {
    const script = document.createElement("script");
    script.src = YANDEX_METRIKA_TAG_JS;
    script.async = true;
    script.dataset.consent = "analytics";
    document.head.appendChild(script);
  }
}

/** Official loader stub — deduplicates tag.js if already present. */
export const YANDEX_METRIKA_LOADER_SNIPPET = `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","${YANDEX_METRIKA_TAG_JS}","ym");`;

export function getYandexMetrikaReadyEventName(counterId: number): string {
  return `yacounter${counterId}inited`;
}

export function isYandexMetrikaCounterReady(counterId: number): boolean {
  if (typeof window === "undefined") return false;
  return typeof window.ym === "function" && Boolean(window[`yaCounter${counterId}`]);
}

/** Inline first pageview — fires after yacounter*inited (SPA defer pattern). */
export function buildYandexMetrikaFirstHitScript(counterId: number): string {
  return `(function(id){var sent=false;function sendHit(){if(sent)return;sent=true;window.__goArgentinaYmFirstHitSent=true;if(typeof ym==="function"){ym(id,"hit",window.location.href,{title:document.title});}}document.addEventListener("yacounter"+id+"inited",sendHit,{once:true});var attempts=0,t=setInterval(function(){if(window["yaCounter"+id]){clearInterval(t);sendHit();}else if(++attempts>100){clearInterval(t);}},100);})(${counterId});`;
}

/** Inline loader + init for SSR `<head>` — required for Yandex _ym_status-check verification. */
export function buildYandexMetrikaBootstrapScript(counterId: number): string {
  const initOptions = JSON.stringify(YANDEX_METRIKA_INIT_OPTIONS);
  return `${YANDEX_METRIKA_LOADER_SNIPPET}ym(${counterId},"init",${initOptions});${buildYandexMetrikaFirstHitScript(counterId)}`;
}

export function parseYandexMetrikaCounterId(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function initYandexMetrika(counterId: number): boolean {
  if (typeof window === "undefined") return false;
  if (window.__goArgentinaYmInited) return true;
  if (typeof window.ym !== "function") return false;

  window.ym(counterId, "init", YANDEX_METRIKA_INIT_OPTIONS);
  window.__goArgentinaYmInited = true;
  return true;
}

export function reachYandexMetrikaGoal(goal: string, params?: Record<string, unknown>): void {
  if (!hasAnalyticsConsent()) return;
  const counterId = getConfiguredYandexMetrikaCounterId();
  if (counterId === null || typeof window === "undefined" || typeof window.ym !== "function") return;
  window.ym(counterId, "reachGoal", goal, params);
}

export function waitForYandexMetrikaReady(counterId: number, timeoutMs = 15000): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") return Promise.resolve(false);
  if (isYandexMetrikaCounterReady(counterId)) return Promise.resolve(true);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
      resolve(ready);
    };

    const eventName = getYandexMetrikaReadyEventName(counterId);
    document.addEventListener(eventName, () => finish(true), { once: true });

    const intervalId = window.setInterval(() => {
      if (isYandexMetrikaCounterReady(counterId)) finish(true);
    }, 50);

    const timeoutId = window.setTimeout(() => {
      finish(isYandexMetrikaCounterReady(counterId));
    }, timeoutMs);
  });
}

export function hitYandexMetrikaPage(counterId: number, url: string, options?: YandexMetrikaHitOptions): void {
  if (!hasAnalyticsConsent()) return;
  if (typeof window === "undefined" || typeof window.ym !== "function") return;
  window.ym(counterId, "hit", url, options);
}

/** Stop the direct counter immediately when analytics consent is revoked. */
export function teardownYandexMetrika(counterId: number): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  try {
    window.ym?.(counterId, "destruct");
  } catch {
    /* A partially initialized counter may not support destruct yet. */
  }
  document.querySelector(`script[src="${YANDEX_METRIKA_TAG_JS}"]`)?.remove();
  delete window[`yaCounter${counterId}`];
  delete window.__goArgentinaYmInited;
  delete window.__goArgentinaYmFirstHitSent;
}

export function resolveYandexMetrikaPageUrl(pathname: string, search: string): string {
  if (typeof window === "undefined") return pathname;
  return `${window.location.origin}${pathname}${search ? `?${search}` : ""}`;
}

export function getConfiguredYandexMetrikaCounterId(): number | null {
  return parseYandexMetrikaCounterId(getYandexMetrikaCounterId());
}
