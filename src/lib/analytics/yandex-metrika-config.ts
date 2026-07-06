/** Yandex Metrika counter — loaded directly in app code (not via GTM). */

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

export function getYandexMetrikaCounterId(): string | null {
  return readEnv("NEXT_PUBLIC_YANDEX_METRIKA_ID");
}

/** Production host with a counter ID configured. */
export function isYandexMetrikaEnabled(): boolean {
  return process.env.NODE_ENV === "production" && Boolean(getYandexMetrikaCounterId());
}
