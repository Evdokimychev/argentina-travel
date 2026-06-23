import type { YouTravelAuthMode } from "@/lib/youtravel/env";

/** Affise affiliate stats API (api-travelme.affise.com) — not the tour catalog API. */
export function buildAffiseAuthHeader(apiKey: string): Record<string, string> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new Error("Affise API key is missing");
  }
  return { "API-Key": trimmed };
}

export function buildYouTravelAuthHeader(input: {
  mode: YouTravelAuthMode;
  email: string;
  password: string;
  apiKey: string | null;
}): Record<string, string> {
  const secret =
    input.mode === "basic_api_key" || input.mode === "bearer_api_key"
      ? input.apiKey || input.password
      : input.password || input.apiKey;

  if (!secret) {
    throw new Error("YouTravel auth secret is missing");
  }

  if (input.mode === "bearer_api_key") {
    return { Authorization: `Bearer ${secret}` };
  }

  const token = Buffer.from(`${input.email}:${secret}`, "utf8").toString("base64");
  return { Authorization: `Basic ${token}` };
}
