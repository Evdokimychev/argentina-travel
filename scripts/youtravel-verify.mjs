#!/usr/bin/env node
/**
 * Verify YouTravel.me partner API credentials (v2).
 * Usage: npm run youtravel:verify
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildYouTravelAuthHeader, getYouTravelAuthAttempts } from "./youtravel-auth.mjs";
import {
  buildPartnerOffersPath,
  buildPartnerTourPath,
  buildSerpPath,
  fetchPartnerTourOffers,
  resolvePartnerOfferLink,
  resolvePartnerPid,
  unwrapYouTravelList,
  unwrapYouTravelTour,
  youtravelFetchJson,
} from "./youtravel-api.mjs";

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

function buildAffiseAuthHeader(apiKey) {
  return { "API-Key": apiKey.trim() };
}

async function verifyYouTravelBookingApi(apiBase, authHeaders) {
  const path = "/v1/booking-requests";
  const payload = {
    tour_id: 0,
    start_date: "2000-01-01",
    persons_count: 0,
    name: "verify",
    email: "verify@example.com",
    phone: "+10000000000",
  };

  try {
    const response = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: {
        ...authHeaders,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => null);

    if (response.status === 401 || response.status === 422) {
      console.log(
        "YouTravel booking API:",
        path,
        "— reachable (status",
        response.status + ", expected for dry-run probe)"
      );
      return true;
    }

    if (response.ok) {
      console.log("YouTravel booking API:", path, "— ok (unexpected success on invalid payload)");
      return true;
    }

    console.log(
      "YouTravel booking API:",
      path,
      "— responded",
      response.status,
      body?.message ?? body?.error ?? ""
    );
    return true;
  } catch (error) {
    console.log("YouTravel booking API:", path, "— connection error:", error.message);
    return false;
  }
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
  console.log("YouTravel partner pid:", resolvePartnerPid());

  const attempts = getYouTravelAuthAttempts();
  let lastStatus = null;

  for (const attempt of attempts) {
    const authHeaders = buildYouTravelAuthHeader(attempt.mode, email, password, apiKey);
    const serpPath = buildSerpPath({ take: 3, skip: 0 });
    const serpResult = await youtravelFetchJson(apiBase, authHeaders, serpPath);
    lastStatus = serpResult.response.status;
    const items = unwrapYouTravelList(serpResult.body);

    if (serpResult.response.ok && items.length > 0) {
      console.log("YouTravel catalog auth:", attempt.label, "— ok");
      console.log("YouTravel serp list: ok via", serpPath + ",", items.length, "sample tour(s)");
      if (!process.env.YOUTRAVEL_AUTH_MODE) {
        console.log("Hint: add to .env.local → YOUTRAVEL_AUTH_MODE=" + attempt.mode);
      }

      const sample = items[0];
      console.log(
        "  sample:",
        sample.title ?? sample.name ?? "(no title)",
        "| id:",
        sample.id ?? "?"
      );

      const tourId = sample.id;
      if (tourId != null) {
        const detailPath = buildPartnerTourPath(tourId);
        const detailResult = await youtravelFetchJson(apiBase, authHeaders, detailPath);
        const detail = unwrapYouTravelTour(detailResult.body);
        console.log(
          "YouTravel tour detail:",
          detailResult.response.ok && detail?.id
            ? `ok (${detail.name ?? detail.title ?? "tour " + detail.id})`
            : `failed (${detailResult.response.status})`
        );

        const offers = await fetchPartnerTourOffers(apiBase, authHeaders, tourId);
        console.log("YouTravel partner offers: ok (" + offers.length + " for tour " + tourId + ")");
        const partnerLink = offers.map((offer) => resolvePartnerOfferLink(offer)).find(Boolean);
        if (partnerLink) {
          console.log("  partner link sample:", String(partnerLink).slice(0, 90) + "…");
        }
      }

      await verifyYouTravelBookingApi(apiBase, authHeaders);
      return true;
    }

    console.log("YouTravel catalog auth:", attempt.label, "— failed", serpResult.response.status);
  }

  console.log("YouTravel catalog: all auth attempts failed (last status:", lastStatus + ")");
  return false;
}

async function verifyYouTravelBooking() {
  const email = process.env.YOUTRAVEL_API_EMAIL?.trim().toLowerCase();
  const password = process.env.YOUTRAVEL_API_PASSWORD?.trim();
  const apiKey = process.env.YOUTRAVEL_API_KEY?.trim();
  const apiBase = (process.env.YOUTRAVEL_API_BASE?.trim() || "https://youtravel.me/api").replace(
    /\/$/,
    ""
  );

  if (!email || (!password && !apiKey)) {
    console.log(
      "YouTravel booking: skipped — set YOUTRAVEL_API_EMAIL + YOUTRAVEL_API_PASSWORD in .env.local"
    );
    return null;
  }

  const attempts = getYouTravelAuthAttempts();
  const bookingPaths = ["/v1/booking-requests", "/v1/orders"];
  const probePayload = {
    tour_id: 0,
    start_date: "invalid",
    persons_count: 0,
    name: "",
    email: "invalid",
    phone: "",
  };

  console.log("YouTravel booking API base:", apiBase);

  for (const attempt of attempts) {
    const authHeaders = buildYouTravelAuthHeader(attempt.mode, email, password, apiKey);
    const probes = [];

    for (const path of bookingPaths) {
      try {
        const response = await fetch(`${apiBase}${path}`, {
          method: "POST",
          headers: {
            ...authHeaders,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(probePayload),
        });
        const reachable =
          response.ok || response.status === 401 || response.status === 422 || response.status === 400;
        probes.push({ path, status: response.status, reachable });
      } catch (error) {
        console.log("YouTravel booking probe failed:", path, error instanceof Error ? error.message : error);
        throw error;
      }
    }

    console.log("YouTravel booking auth:", attempt.label);
    for (const probe of probes) {
      console.log(
        "  ",
        probe.path,
        "→",
        probe.status,
        probe.reachable ? "(reachable)" : "(missing)"
      );
    }

    const has401 = probes.some((probe) => probe.status === 401);
    if (has401) {
      console.log(
        "Note: HTTP 401 on booking endpoints — activate booking API in YouTravel partner cabinet."
      );
    }

    const allReachable = probes.every((probe) => probe.reachable);
    return allReachable || has401 ? true : false;
  }

  console.log("YouTravel booking: all auth attempts failed");
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
  const authHeaders = buildAffiseAuthHeader(apiKey);
  const response = await fetch(`${apiBase}${path}`, {
    headers: { ...authHeaders, Accept: "application/json" },
  });
  const body = await response.json().catch(() => null);

  if (response.ok && body?.status === 1) {
    const count = body?.conversions?.length ?? body?.pagination?.total_count ?? 0;
    console.log("YouTravel Affise auth: ok — conversions endpoint reachable (sample count:", count + ")");
    return true;
  }

  const error = body?.error ?? body?.message ?? "(no body)";
  console.log("YouTravel Affise auth: failed", response.status, "—", error);
  return false;
}

async function verifyYouTravel() {
  const catalogOk = await verifyYouTravelCatalog();
  console.log("");
  let bookingOk = null;
  try {
    bookingOk = await verifyYouTravelBooking();
  } catch (error) {
    console.log("YouTravel booking verify error:", error instanceof Error ? error.message : error);
    return false;
  }
  console.log("");
  const affiseOk = await verifyYouTravelAffise();

  if (catalogOk === null && bookingOk === null && affiseOk === null) return false;
  if (catalogOk === false || affiseOk === false) return false;
  return true;
}

loadEnvLocal();

verifyYouTravel()
  .then((ok) => process.exit(ok ? 0 : 1))
  .catch((error) => {
    console.error("YouTravel verify error:", error.message);
    process.exit(1);
  });
