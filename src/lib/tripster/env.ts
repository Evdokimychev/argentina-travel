export type TripsterConfig = {
  partner: string;
  secret: string;
  apiBase: string;
};

export function isTripsterConfigured(): boolean {
  return Boolean(
    process.env.TRIPSTER_PARTNER?.trim() && process.env.TRIPSTER_SECRET?.trim()
  );
}

export function getTripsterConfig(): TripsterConfig {
  const partner = process.env.TRIPSTER_PARTNER?.trim();
  const secret = process.env.TRIPSTER_SECRET?.trim();

  if (!partner || !secret) {
    throw new Error("TRIPSTER_PARTNER and TRIPSTER_SECRET must be configured");
  }

  const apiBase = (process.env.TRIPSTER_API_BASE?.trim() || "https://experience.tripster.ru/api").replace(
    /\/$/,
    ""
  );

  return { partner, secret, apiBase };
}

/** Country slug/name filter for sync scope. */
export function getTripsterSyncCountryMatchers(): string[] {
  const custom = process.env.TRIPSTER_SYNC_COUNTRY?.trim();
  if (custom) return [custom.toLowerCase()];

  return ["argentina", "аргентина"];
}
