import { createHash, randomBytes } from "node:crypto";
import type { PublicApiScope } from "@/types/public-api";

export const PUBLIC_API_KEY_PREFIX = "pva_live_";

export function hashPublicApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey, "utf8").digest("hex");
}

export function generatePublicApiKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const suffix = randomBytes(24).toString("base64url");
  const rawKey = `${PUBLIC_API_KEY_PREFIX}${suffix}`;
  return {
    rawKey,
    keyHash: hashPublicApiKey(rawKey),
    keyPrefix: rawKey.slice(0, 12),
  };
}

export function parsePublicApiScopes(raw: unknown): PublicApiScope[] {
  if (!Array.isArray(raw)) return ["tours:read", "excursions:read"];
  const allowed = new Set<PublicApiScope>(["tours:read", "excursions:read", "*"]);
  const scopes = raw.filter((item): item is PublicApiScope => typeof item === "string" && allowed.has(item as PublicApiScope));
  return scopes.length ? scopes : ["tours:read", "excursions:read"];
}

export function publicApiKeyHasScope(scopes: readonly string[], required: PublicApiScope): boolean {
  if (scopes.includes("*")) return true;
  return scopes.includes(required);
}
