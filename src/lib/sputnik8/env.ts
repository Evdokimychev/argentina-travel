export type Sputnik8Config = {
  apiKey: string;
  username: string;
  apiBase: string;
  defaultLang: string;
  defaultCurrency: string;
};

export function isSputnik8Configured(): boolean {
  return Boolean(
    process.env.SPUTNIK8_API_KEY?.trim() && process.env.SPUTNIK8_USERNAME?.trim()
  );
}

export function getSputnik8Config(): Sputnik8Config {
  const apiKey = process.env.SPUTNIK8_API_KEY?.trim();
  const username = process.env.SPUTNIK8_USERNAME?.trim();

  if (!apiKey || !username) {
    throw new Error("SPUTNIK8_API_KEY and SPUTNIK8_USERNAME must be configured");
  }

  const apiBase = (process.env.SPUTNIK8_API_BASE?.trim() || "https://api.sputnik8.com/v1").replace(
    /\/$/,
    ""
  );

  return {
    apiKey,
    username,
    apiBase,
    defaultLang: process.env.SPUTNIK8_DEFAULT_LANG?.trim() || "ru",
    defaultCurrency: process.env.SPUTNIK8_DEFAULT_CURRENCY?.trim() || "USD",
  };
}

/** Country slug/name filter for sync scope. */
export function getSputnik8SyncCountryMatchers(): string[] {
  const custom = process.env.SPUTNIK8_SYNC_COUNTRY?.trim();
  if (custom) {
    return custom
      .toLowerCase()
      .split(/[,\s]+/)
      .filter(Boolean);
  }

  return ["argentina", "аргентина"];
}
