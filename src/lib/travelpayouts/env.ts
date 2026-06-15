export type TravelpayoutsConfig = {
  apiKey: string;
  marker: number;
  trs: number;
  defaultShorten: boolean;
};

function readRequiredInt(name: string): number {
  const raw = process.env[name]?.trim();
  const value = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(value)) {
    throw new Error(`Missing or invalid ${name}`);
  }
  return value;
}

export function isTravelpayoutsConfigured(): boolean {
  return Boolean(
    process.env.TRAVELPAYOUTS_API_KEY?.trim() &&
      process.env.TRAVELPAYOUTS_MARKER?.trim() &&
      process.env.TRAVELPAYOUTS_TRS?.trim()
  );
}

export function getTravelpayoutsConfig(): TravelpayoutsConfig {
  const apiKey = process.env.TRAVELPAYOUTS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("TRAVELPAYOUTS_API_KEY is not configured");
  }

  return {
    apiKey,
    marker: readRequiredInt("TRAVELPAYOUTS_MARKER"),
    trs: readRequiredInt("TRAVELPAYOUTS_TRS"),
    defaultShorten: process.env.TRAVELPAYOUTS_SHORTEN_LINKS !== "false",
  };
}
