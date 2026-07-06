import { getYandexMetrikaCounterId } from "@/lib/analytics/yandex-metrika-config";

declare global {
  interface Window {
    ym?: YandexMetrikaFn;
    __goArgentinaYmInited?: boolean;
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

/** Official loader stub — deduplicates tag.js if already present. */
export const YANDEX_METRIKA_LOADER_SNIPPET = `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","${YANDEX_METRIKA_TAG_JS}","ym");`;

/** Inline loader + init for SSR `<head>` — required for Yandex _ym_status-check verification. */
export function buildYandexMetrikaBootstrapScript(counterId: number): string {
  const initOptions = JSON.stringify(YANDEX_METRIKA_INIT_OPTIONS);
  return `${YANDEX_METRIKA_LOADER_SNIPPET}ym(${counterId},"init",${initOptions});window.__goArgentinaYmInited=true;`;
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

export function hitYandexMetrikaPage(counterId: number, url: string, options?: YandexMetrikaHitOptions): void {
  if (typeof window === "undefined" || typeof window.ym !== "function") return;
  window.ym(counterId, "hit", url, options);
}

export function resolveYandexMetrikaPageUrl(pathname: string, search: string): string {
  if (typeof window === "undefined") return pathname;
  return `${window.location.origin}${pathname}${search ? `?${search}` : ""}`;
}

export function getConfiguredYandexMetrikaCounterId(): number | null {
  return parseYandexMetrikaCounterId(getYandexMetrikaCounterId());
}
