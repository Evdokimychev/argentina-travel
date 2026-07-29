/** Yandex Metrika counter — loaded directly in app code (not via GTM). */

function readEnv(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized || null;
}

export function getYandexMetrikaCounterId(): string | null {
  return readEnv(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID);
}

/** Production host with a counter ID configured. */
export function isYandexMetrikaEnabled(): boolean {
  return process.env.NODE_ENV === "production" && Boolean(getYandexMetrikaCounterId());
}
