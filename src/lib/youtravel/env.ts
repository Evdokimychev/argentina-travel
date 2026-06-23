export type YouTravelAuthMode = "basic_password" | "basic_api_key" | "bearer_api_key";

export type YouTravelAffiseConfig = {
  apiBase: string;
  apiKey: string;
};

export type YouTravelConfig = {
  apiBase: string;
  email: string;
  password: string;
  apiKey: string | null;
  authMode: YouTravelAuthMode;
};

function resolveEmail(): string | null {
  return process.env.YOUTRAVEL_API_EMAIL?.trim().toLowerCase() || null;
}

function resolvePassword(): string | null {
  return process.env.YOUTRAVEL_API_PASSWORD?.trim() || null;
}

function resolveApiKey(): string | null {
  return process.env.YOUTRAVEL_API_KEY?.trim() || null;
}

function resolveAuthMode(): YouTravelAuthMode {
  const configured = process.env.YOUTRAVEL_AUTH_MODE?.trim().toLowerCase();
  if (configured === "basic_password") return "basic_password";
  if (configured === "basic_api_key") return "basic_api_key";
  if (configured === "bearer_api_key") return "bearer_api_key";
  return "basic_password";
}

function resolveAffiseApiKey(): string | null {
  return process.env.YOUTRAVEL_AFFISE_API_KEY?.trim() || null;
}

export function isYouTravelAffiseConfigured(): boolean {
  return Boolean(resolveAffiseApiKey());
}

export function getYouTravelAffiseConfig(): YouTravelAffiseConfig {
  const apiKey = resolveAffiseApiKey();
  if (!apiKey) {
    throw new Error("YOUTRAVEL_AFFISE_API_KEY must be configured");
  }

  const apiBase = (
    process.env.YOUTRAVEL_AFFISE_API_BASE?.trim() || "https://api-travelme.affise.com"
  ).replace(/\/$/, "");

  return { apiBase, apiKey };
}

export function isYouTravelConfigured(): boolean {
  const email = resolveEmail();
  const secret = resolvePassword() || resolveApiKey();
  return Boolean(email && secret);
}

export function getYouTravelConfig(): YouTravelConfig {
  const email = resolveEmail();
  const password = resolvePassword();
  const apiKey = resolveApiKey();
  const authMode = resolveAuthMode();

  const secret =
    authMode === "basic_api_key" || authMode === "bearer_api_key"
      ? apiKey || password
      : password || apiKey;

  if (!email || !secret) {
    throw new Error(
      "YOUTRAVEL_API_EMAIL and YOUTRAVEL_API_PASSWORD or YOUTRAVEL_API_KEY must be configured"
    );
  }

  const apiBase = (
    process.env.YOUTRAVEL_API_BASE?.trim() || "https://youtravel.me/api"
  ).replace(/\/$/, "");

  return {
    apiBase,
    email,
    password: password || secret,
    apiKey,
    authMode,
  };
}

/** Ordered auth strategies for verify / first connection. */
export function getYouTravelAuthAttempts(): Array<{
  mode: YouTravelAuthMode;
  label: string;
}> {
  const configured = process.env.YOUTRAVEL_AUTH_MODE?.trim();
  if (configured) {
    return [{ mode: resolveAuthMode(), label: configured }];
  }

  const attempts: Array<{ mode: YouTravelAuthMode; label: string }> = [];
  if (resolvePassword()) {
    attempts.push({ mode: "basic_password", label: "basic (email + password)" });
  }
  if (resolveApiKey()) {
    attempts.push({ mode: "basic_api_key", label: "basic (email + api key)" });
    attempts.push({ mode: "bearer_api_key", label: "bearer (api key)" });
  }
  return attempts;
}

/** Country / region filter for sync scope (comma-separated). */
export function getYouTravelSyncCountryMatchers(): string[] {
  const custom = process.env.YOUTRAVEL_SYNC_COUNTRY?.trim();
  if (custom) {
    return custom
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean);
  }

  return ["argentina", "аргентина"];
}
