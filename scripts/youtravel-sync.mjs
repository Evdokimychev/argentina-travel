#!/usr/bin/env node
/**
 * Sync YouTravel.me partner catalog into Supabase.
 * Usage: npm run youtravel:sync
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveYouTravelAuthHeaders } from "./youtravel-auth.mjs";
import {
  createPgClientFromEnv,
  pgDeleteOffersForTour,
  pgFinishSyncRun,
  pgInsertSyncRun,
  pgUpsertOffers,
  pgUpsertTours,
} from "./youtravel-db-pg.mjs";

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
  return body.data ?? body.items ?? body.tours ?? body.offers ?? [];
}

function getSyncCountryMatchers() {
  const custom = process.env.YOUTRAVEL_SYNC_COUNTRY?.trim();
  if (custom) {
    return custom
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean);
  }
  return ["argentina", "аргентина"];
}

function resolveCountryName(tour) {
  if (typeof tour.country === "string") return tour.country.trim() || null;
  if (tour.country && typeof tour.country === "object") {
    return tour.country.nameRu?.trim() || tour.country.name?.trim() || null;
  }
  return tour.destination?.trim() || null;
}

function matchesCountry(tour, matchers) {
  if (!matchers.length) return true;
  const haystack = [
    resolveCountryName(tour),
    typeof tour.region === "string" ? tour.region : tour.region?.nameRu ?? tour.region?.name,
    typeof tour.city === "string" ? tour.city : tour.city?.nameRu ?? tour.city?.name,
    tour.destination,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return matchers.some((matcher) => haystack.includes(matcher));
}

function slugifyTitle(title) {
  const map = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
    й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
    у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
    э: "e", ю: "yu", я: "ya",
  };
  const normalized = title
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => map[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return normalized || "tour";
}

function buildSlug(title, id) {
  return `${slugifyTitle(title)}-yt${id}`;
}

function resolveTourId(tour) {
  const raw = tour.id ?? tour.externalId;
  const parsed = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveCoverImage(tour) {
  if (tour.coverImage?.trim()) return tour.coverImage.trim();
  if (tour.image?.trim()) return tour.image.trim();
  if (tour.previewImage?.trim()) return tour.previewImage.trim();
  const first = tour.photos?.[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object") {
    return first.medium || first.url || first.src || null;
  }
  return null;
}

function resolvePhotos(tour) {
  const photos = tour.photos ?? tour.gallery ?? [];
  if (!Array.isArray(photos)) return [];
  return photos
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return item.medium || item.url || item.src || null;
      }
      return null;
    })
    .filter(Boolean);
}

function mapTourRow(tour) {
  const id = resolveTourId(tour);
  if (id == null) return null;

  const title = tour.title?.trim() || tour.name?.trim() || `Tour ${id}`;
  const durationDays = tour.durationDays ?? tour.duration ?? null;
  const durationNights =
    tour.durationNights ??
    (durationDays != null ? Math.max(durationDays - 1, 0) : null);

  return {
    id,
    slug: tour.slug?.trim() || buildSlug(title, id),
    title,
    country: resolveCountryName(tour),
    region:
      typeof tour.region === "string"
        ? tour.region
        : tour.region?.nameRu ?? tour.region?.name ?? null,
    city:
      typeof tour.city === "string" ? tour.city : tour.city?.nameRu ?? tour.city?.name ?? null,
    status: tour.status ?? (tour.isPublished === false ? "draft" : "published"),
    durationDays,
    durationNights,
    rating: tour.rating ?? null,
    reviewCount: tour.reviewCount ?? tour.reviewsCount ?? 0,
    priceValue: tour.priceFrom ?? tour.minPrice ?? tour.price ?? null,
    priceCurrency: tour.currency ?? null,
    priceDisplay: null,
    youtravelUrl: tour.url?.trim() || `https://youtravel.me/tours/${tour.slug ?? id}`,
    partnerUrl: null,
    coverImage: resolveCoverImage(tour),
    photos: resolvePhotos(tour),
    payload: tour,
  };
}

function mapOfferRow(tourId, offer, index) {
  const idRaw = offer.id ?? offer.externalId ?? `${tourId}-${index}`;
  const id =
    typeof idRaw === "number"
      ? idRaw
      : Number.parseInt(String(idRaw).replace(/\D/g, "").slice(0, 12), 10) ||
        Number(`${tourId}${index}`);

  return {
    id,
    tourId,
    startDate: (offer.startDate ?? offer.date ?? null)?.slice?.(0, 10) ?? offer.startDate ?? offer.date,
    endDate: (offer.endDate ?? offer.startDate ?? offer.date ?? null)?.slice?.(0, 10) ?? null,
    priceValue: offer.priceFrom ?? offer.price ?? null,
    priceCurrency: offer.currency ?? null,
    seatsAvailable: offer.seatsAvailable ?? offer.placesLeft ?? offer.seatsTotal ?? null,
    payload: offer,
  };
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAllTours(apiBase, authHeaders) {
  const pageSize = 200;
  const maxPages = 50;
  const all = [];

  for (let page = 0; page < maxPages; page += 1) {
    const skip = page * pageSize;
    const response = await fetch(`${apiBase}/v1/tours?take=${pageSize}&skip=${skip}`, {
      headers: { ...authHeaders, Accept: "application/json" },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`YouTravel tours fetch failed (${response.status})`);
    }
    if (body?.success === false && !unwrapList(body).length) {
      throw new Error("YouTravel auth failed — check credentials");
    }

    const batch = unwrapList(body);
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < pageSize) break;
    await sleep(120);
  }

  return all;
}

async function fetchTourOffers(apiBase, authHeaders, tourId) {
  const response = await fetch(`${apiBase}/v1/tours/${encodeURIComponent(String(tourId))}/offers`, {
    headers: { ...authHeaders, Accept: "application/json" },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) return [];
  return unwrapList(body);
}

async function createAffiliateLink(youtravelUrl, tourId, country) {
  const tpKey = process.env.TRAVELPAYOUTS_API_KEY?.trim();
  const marker = process.env.TRAVELPAYOUTS_MARKER?.trim();
  const trs = process.env.TRAVELPAYOUTS_TRS?.trim();
  if (!tpKey || !marker || !trs) return null;

  const response = await fetch("https://api.travelpayouts.com/links/v1/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": tpKey,
    },
    body: JSON.stringify({
      trs: Number(trs),
      marker: Number(marker),
      shorten: process.env.TRAVELPAYOUTS_SHORTEN_LINKS !== "false",
      links: [{ url: youtravelUrl, sub_id: `youtravel:${country ?? "tour"}:${tourId}` }],
    }),
  });

  const body = await response.json().catch(() => null);
  const link = body?.result?.links?.[0];
  if (!response.ok || link?.code !== "success") return null;
  return link.partner_url || link.url || null;
}

async function main() {
  loadEnvLocal();

  const apiBase = (process.env.YOUTRAVEL_API_BASE?.trim() || "https://youtravel.me/api").replace(
    /\/$/,
    ""
  );
  const skipAffiliate = process.env.YOUTRAVEL_SKIP_AFFILIATE_LINKS === "true";
  const countryMatchers = getSyncCountryMatchers();
  const pg = createPgClientFromEnv();
  await pg.connect();

  let runId = null;
  try {
    const { headers: authHeaders, mode } = await resolveYouTravelAuthHeaders(apiBase);
    console.log("YouTravel auth mode:", mode);

    runId = await pgInsertSyncRun(pg, { countryMatchers, authMode: mode });
    console.log("YouTravel sync run:", runId);

    const rawTours = await fetchAllTours(apiBase, authHeaders);
    console.log("Fetched tours:", rawTours.length);

    const scoped = rawTours.filter((tour) => matchesCountry(tour, countryMatchers));
    console.log("After country filter:", scoped.length, countryMatchers);

    const rows = scoped.map(mapTourRow).filter(Boolean);
    let offersUpserted = 0;

    for (const row of rows) {
      if (!skipAffiliate && !row.partnerUrl) {
        const partnerUrl = await createAffiliateLink(row.youtravelUrl, row.id, row.country);
        if (partnerUrl) row.partnerUrl = partnerUrl;
        await sleep(700);
      }

      const offers = await fetchTourOffers(apiBase, authHeaders, row.id);
      await pgDeleteOffersForTour(pg, row.id);
      const offerRows = offers.map((offer, index) => mapOfferRow(row.id, offer, index));
      offersUpserted += await pgUpsertOffers(pg, offerRows);
      await sleep(120);
    }

    const upserted = await pgUpsertTours(pg, rows);

    await pgFinishSyncRun(pg, runId, {
      status: "success",
      toursFetched: rawTours.length,
      toursUpserted: upserted,
      offersUpserted,
    });

    console.log("Upserted tours:", upserted);
    console.log("Upserted offers:", offersUpserted);
  } catch (error) {
    if (runId) {
      await pgFinishSyncRun(pg, runId, {
        status: "error",
        errorMessage: error.message,
      });
    }
    throw error;
  } finally {
    await pg.end();
  }
}

main().catch((error) => {
  console.error("YouTravel sync failed:", error.message);
  process.exit(1);
});
