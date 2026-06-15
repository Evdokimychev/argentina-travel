import { getTripsterConfig } from "@/lib/tripster/env";
import type { TripsterObtainTokenResponse } from "@/lib/tripster/types";

type TokenCache = {
  token: string;
  expiresAt: number;
};

const TOKEN_TTL_MS = 23 * 60 * 60 * 1000;

declare global {
  // eslint-disable-next-line no-var
  var __tripsterTokenCache: TokenCache | undefined;
}

function readCache(): TokenCache | null {
  const cache = globalThis.__tripsterTokenCache;
  if (!cache) return null;
  if (Date.now() >= cache.expiresAt) return null;
  return cache;
}

function writeCache(token: string) {
  globalThis.__tripsterTokenCache = {
    token,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
}

export function clearTripsterTokenCache() {
  globalThis.__tripsterTokenCache = undefined;
}

export async function getTripsterAccessToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    const cached = readCache();
    if (cached) return cached.token;
  }

  const { partner, secret, apiBase } = getTripsterConfig();

  const response = await fetch(`${apiBase}/auth/obtain_token/partner/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ partner, secret }),
  });

  const body = (await response.json().catch(() => null)) as TripsterObtainTokenResponse | null;

  if (!response.ok || !body?.token) {
    throw new Error(`Failed to obtain Tripster token (${response.status})`);
  }

  writeCache(body.token);
  return body.token;
}
