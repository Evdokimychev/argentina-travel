#!/usr/bin/env node
/**
 * Verify YouTravel.me partner API credentials.
 * - Catalog API: youtravel.me/api (BasicAuth) — required for tour sync
 * - Affise stats API: api-travelme.affise.com (API-Key header) — optional, affiliate reporting only
 * Usage: npm run youtravel:verify
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(root, file);
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function unwrapList(body) {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  return body.data ?? body.items ?? body.tours ?? [];
}

function buildAuthHeader(mode, email, password, apiKey) {
  const secret =
    mode === "basic_api_key" || mode === "bearer_api_key"
      ? apiKey || password
      : password || apiKey;

  if (mode === "bearer_api_key") {
    return { Authorization: `Bearer ${secret}` };
  }

  const token = Buffer.from(`${email}:${secret}`, "utf8").toString("base64");
  return { Authorization: `Basic ${token}` };
}

function buildAffiseAuthHeader(apiKey) {
  return { "API-Key": apiKey.trim() };
}

function getAuthAttempts() {
  const configured = process.env.YOUTRAVEL_AUTH_MODE?.trim();
  if (configured) {
    return [{ mode: configured, label: configured }];
  }

  const attempts = [];
  if (process.env.YOUTRAVEL_API_PASSWORD?.trim()) {
    attempts.push({ mode: "basic_password", label: "basic (email + password)" });
  }
  if (process.env.YOUTRAVEL_API_KEY?.trim()) {
    attempts.push({ mode: "basic_api_key", label: "basic (email + api key)" });
    attempts.push({ mode: "bearer_api_key", label: "bearer (api key)" });
  }
  return attempts;
}

async function fetchTours(apiBase, authHeaders) {
  const response = await fetch(`${apiBase}/v1/tours?take=3`, {
    headers: {
      ...authHeaders,
      Accept: "application/json",
    },
  });
  const body = await response.json().catch(() => null);
  const tours = unwrapList(body);
  const ok = response.ok && !(body?.success === false && !tours.length);
  return { response, body, tours, ok };
}

async function verifyYouTravelCatalog() {
  const email = process.env.YOUTRAVEL_API_EMAIL?.trim().toLowerCase();
  const password = process.env.YOUTRAVEL_API_PASSWORD?.trim();
  const apiKey = process.env.YOUTRAVEL_API_KEY?.trim();
  const apiBase = (process.env.YOUTRAVEL_API_BASE?.trim() || "https://youtravel.me/api").replace(
    /\/$/,
    ""
  );

  if (!email || (!password && !apiKey)) {
    console.log(
      "YouTravel catalog: skipped — set YOUTRAVEL_API_EMAIL + YOUTRAVEL_API_PASSWORD in .env.local"
    );
    return null;
  }

  console.log("YouTravel catalog API base:", apiBase);
  console.log("YouTravel email:", email);

  const attempts = getAuthAttempts();
  let lastStatus = null;

  for (const attempt of attempts) {
    const authHeaders = buildAuthHeader(attempt.mode, email, password, apiKey);
    const result = await fetchTours(apiBase, authHeaders);
    lastStatus = result.response.status;

    if (result.ok && result.tours.length > 0) {
      console.log("YouTravel catalog auth:", attempt.label, "— ok");
      console.log("YouTravel tours list: ok,", result.tours.length, "sample tour(s)");
      if (!process.env.YOUTRAVEL_AUTH_MODE) {
        console.log("Hint: add to .env.local → YOUTRAVEL_AUTH_MODE=" + attempt.mode);
      }

      const sample = result.tours[0];
      console.log(
        "  sample:",
        sample.title ?? sample.name ?? "(no title)",
        "| id:",
        sample.id ?? sample.externalId ?? "?"
      );

      const firstId = sample.id ?? sample.externalId;
      if (firstId != null) {
        const offersResponse = await fetch(
          `${apiBase}/v1/tours/${encodeURIComponent(String(firstId))}/offers`,
          { headers: { ...authHeaders, Accept: "application/json" } }
        );
        const offersBody = await offersResponse.json().catch(() => null);
        const offers = unwrapList(offersBody);
        console.log(
          "YouTravel offers:",
          offersResponse.ok
            ? `ok (${offers.length} for tour ${firstId})`
            : `failed (${offersResponse.status})`
        );
      }

      return true;
    }

    console.log("YouTravel catalog auth:", attempt.label, "— failed", result.response.status);
  }

  console.log("YouTravel tours list: all auth attempts failed (last status:", lastStatus + ")");
  console.log("Catalog sync needs youtravel.me/api BasicAuth — ask a.golik@youtravel.me to enable API");
  return false;
}

async function verifyYouTravelAffise() {
  const apiKey = process.env.YOUTRAVEL_AFFISE_API_KEY?.trim();
  if (!apiKey) {
    console.log("YouTravel Affise: skipped — set YOUTRAVEL_AFFISE_API_KEY in .env.local (optional)");
    return null;
  }

  const apiBase = (
    process.env.YOUTRAVEL_AFFISE_API_BASE?.trim() || "https://api-travelme.affise.com"
  ).replace(/\/$/, "");

  const today = new Date();
  const dateTo = today.toISOString().slice(0, 10);
  const dateFrom = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const path = `/3.0/stats/conversions?limit=1&date_from=${dateFrom}&date_to=${dateTo}`;

  console.log("YouTravel Affise API base:", apiBase);
  console.log("YouTravel Affise probe:", path);

  const authHeaders = buildAffiseAuthHeader(apiKey);
  const response = await fetch(`${apiBase}${path}`, {
    headers: { ...authHeaders, Accept: "application/json" },
  });
  const body = await response.json().catch(() => null);

  if (response.ok && body?.status === 1) {
    const count = body?.conversions?.length ?? body?.pagination?.total_count ?? 0;
    console.log("YouTravel Affise auth: ok — conversions endpoint reachable (sample count:", count + ")");
    console.log("Note: Affise API is for affiliate stats only — not tour catalog sync");
    return true;
  }

  const error = body?.error ?? body?.message ?? "(no body)";
  console.log("YouTravel Affise auth: failed", response.status, "—", error);
  console.log(
    "Affise key comes from your partner profile at api-travelme.affise.com — not the docs example hash"
  );
  return false;
}

async function verifyYouTravel() {
  const catalogOk = await verifyYouTravelCatalog();
  console.log("");
  const affiseOk = await verifyYouTravelAffise();

  if (catalogOk === null && affiseOk === null) {
    return false;
  }
  if (catalogOk === false || affiseOk === false) {
    return false;
  }
  return true;
}

loadEnvLocal();

verifyYouTravel()
  .then((ok) => process.exit(ok ? 0 : 1))
  .catch((error) => {
    console.error("YouTravel verify error:", error.message);
    process.exit(1);
  });
