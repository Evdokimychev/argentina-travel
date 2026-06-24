#!/usr/bin/env node
/**
 * Sync YouTravel.me partner catalog into Supabase (v2 partner API).
 * Usage: npm run youtravel:sync
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveYouTravelAuthHeaders } from "./youtravel-auth.mjs";
import {
  discoverYouTravelTourIds,
  fetchPartnerTourDetail,
  fetchPartnerTourOffers,
  fetchPartnerTourReviews,
  parseOfferDate,
  resolvePartnerOfferLink,
} from "./youtravel-api.mjs";
import { fetchPublicTourPageData } from "./youtravel-public-description.mjs";
import {
  createPgClientFromEnv,
  pgDeleteOffersForTour,
  pgFinishSyncRun,
  pgInsertSyncRun,
  pgUpsertOffers,
  pgUpsertTours,
} from "./youtravel-db-pg.mjs";
import { normalizeYouTravelPartnerPrice } from "./youtravel-price.mjs";

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

function getSyncCountryMatchers() {
  const custom = process.env.YOUTRAVEL_SYNC_COUNTRY?.trim();
  const matchers = custom
    ? custom
        .split(",")
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean)
    : ["argentina", "аргентина"];

  if (matchers.includes("argentina") && !matchers.includes("аргентина")) {
    matchers.push("аргентина");
  }

  return matchers;
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

function resolveCoverImage(tour, serpItem) {
  const preview = serpItem?.preview_image;
  if (typeof preview === "string" && preview.trim()) {
    return preview.startsWith("http")
      ? preview.trim()
      : `https://cf.youtravel.me/${preview.replace(/^\//, "")}`;
  }
  const gallery = tour.gallery ?? [];
  const first = gallery[0];
  if (first && typeof first === "object" && first.src) return first.src;
  if (typeof first === "string") return first;
  return null;
}

function resolvePhotos(tour) {
  const gallery = tour.gallery ?? tour.photos ?? tour.photo_allocation ?? [];
  if (!Array.isArray(gallery)) return [];
  return gallery
    .map((item) => {
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (!trimmed) return null;
        return /^https?:\/\//i.test(trimmed)
          ? trimmed
          : `https://cf.youtravel.me/${trimmed.replace(/^\//, "")}`;
      }
      if (item && typeof item === "object") {
        const raw =
          item.src?.trim() || item.url?.trim() || item.medium?.trim() || item.thumbnail?.trim();
        if (!raw) return null;
        if (/^https?:\/\//i.test(raw)) return raw;
        const host = item.host?.trim() || "cf.youtravel.me";
        return `https://${host.replace(/^\//, "")}/${raw.replace(/^\//, "")}`;
      }
      return null;
    })
    .filter(Boolean);
}

function mapTourRow(tour, serpItem, offers, publicPageData, apiReviews = []) {
  const id = tour?.id;
  if (id == null) return null;

  const title = tour.name?.trim() || tour.title?.trim() || serpItem?.title?.trim() || `Tour ${id}`;
  const durationDays = tour.days?.length ?? tour.durationDays ?? tour.duration ?? null;
  const durationNights =
    tour.durationNights ?? (durationDays != null ? Math.max(durationDays - 1, 0) : null);
  const partnerUrl =
    offers.map((offer) => resolvePartnerOfferLink(offer)).find(Boolean) ?? null;
  const minOffer = offers.find((offer) => offer.priceValue != null) ?? offers[0];
  const rawPriceValue =
    minOffer?.priceValue ?? minOffer?.price ?? serpItem?.priceValue ?? null;
  const rawPriceCurrency = minOffer?.currency ?? serpItem?.currency ?? null;
  const normalizedPrice = normalizeYouTravelPartnerPrice(rawPriceValue, rawPriceCurrency);
  const reviews =
    apiReviews.length > 0
      ? apiReviews
      : publicPageData?.reviews?.length
        ? publicPageData.reviews
        : Array.isArray(tour.reviews)
          ? tour.reviews
          : [];

  return {
    id,
    slug: tour.slug?.trim() || buildSlug(title, id),
    title,
    country:
      (Array.isArray(tour.countries) && tour.countries[0]) ||
      (Array.isArray(serpItem?.countries) && serpItem.countries[0]) ||
      tour.country ||
      null,
    region:
      tour.region ||
      (Array.isArray(tour.regions) && tour.regions[0]) ||
      (Array.isArray(serpItem?.regions) && serpItem.regions[0]) ||
      null,
    city:
      typeof tour.start_point_city === "object"
        ? tour.start_point_city?.name
        : tour.start_point_city ?? tour.city ?? null,
    status: tour.status ?? "published",
    durationDays,
    durationNights,
    rating: Number.parseFloat(String(tour.rating ?? serpItem?.rating ?? "")) || null,
    reviewCount: Number.parseInt(String(tour.count_reviews ?? serpItem?.reviewCount ?? 0), 10) || 0,
    priceValue: normalizedPrice.value,
    priceCurrency: normalizedPrice.currency,
    priceDisplay: null,
    youtravelUrl: tour.url?.trim() || `https://youtravel.me/tours/${id}`,
    partnerUrl,
    coverImage: resolveCoverImage(tour, serpItem),
    photos: resolvePhotos(tour),
    payload: {
      ...tour,
      public_description: publicPageData?.schemaDescription ?? undefined,
      public_page_extras: publicPageData
        ? {
            descriptionHtml: publicPageData.descriptionHtml,
            schemaDescription: publicPageData.schemaDescription,
            activityComment: publicPageData.activityComment,
            activityDescription: publicPageData.activityDescription,
            activityLabel: publicPageData.activityLabel,
            comfortDescription: publicPageData.comfortDescription,
            accommodationPhotos: publicPageData.accommodationPhotos,
            importantToKnowItems: publicPageData.importantToKnowItems,
            arrivalInfo: publicPageData.arrivalInfo,
            reviews: publicPageData.reviews?.length ? publicPageData.reviews : reviews,
          }
        : undefined,
      reviews,
      public_activity_comment: publicPageData?.activityComment ?? undefined,
      public_activity_description: publicPageData?.activityDescription ?? undefined,
      public_activity_label: publicPageData?.activityLabel ?? undefined,
      countries: serpItem?.countries ?? tour.countries,
      serp: serpItem ?? null,
    },
  };
}

function mapOfferRow(tourId, offer, index) {
  const idRaw = offer.id ?? `${tourId}-${index}`;
  const id =
    typeof idRaw === "number"
      ? idRaw
      : Number.parseInt(String(idRaw).replace(/\D/g, "").slice(0, 12), 10) ||
        Number(`${tourId}${index}`);

  const normalizedPrice = normalizeYouTravelPartnerPrice(
    offer.priceValue ?? offer.price ?? null,
    offer.currency ?? null
  );

  return {
    id,
    tourId,
    startDate: parseOfferDate(offer.dateFrom ?? offer.startDate ?? offer.date),
    endDate: parseOfferDate(offer.dateTo ?? offer.endDate ?? offer.dateFrom ?? offer.startDate),
    priceValue: normalizedPrice.value,
    priceCurrency: normalizedPrice.currency,
    seatsAvailable: offer.freeSpaces ?? offer.seatsAvailable ?? offer.placesLeft ?? null,
    payload: offer,
  };
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  loadEnvLocal();

  const apiBase = (process.env.YOUTRAVEL_API_BASE?.trim() || "https://youtravel.me/api").replace(
    /\/$/,
    ""
  );
  const countryMatchers = getSyncCountryMatchers();
  const pg = createPgClientFromEnv();
  await pg.connect();

  let runId = null;
  try {
    const { headers: authHeaders, mode } = await resolveYouTravelAuthHeaders(apiBase);
    console.log("YouTravel auth mode:", mode);

    runId = await pgInsertSyncRun(pg, { countryMatchers, authMode: mode });
    console.log("YouTravel sync run:", runId);

    console.log("Discovering tours via /v2/serp/tours …");
    const discovered = await discoverYouTravelTourIds(apiBase, authHeaders, countryMatchers, {
      onPage: (page, matched, total) => {
        console.log(`  serp page ${page}: matched ${matched}${total != null ? ` / catalog ${total}` : ""}`);
      },
    });
    console.log("Matched tours:", discovered.size, countryMatchers);

    const rows = [];
    let offersUpserted = 0;

    for (const [tourId, serpItem] of discovered) {
      try {
        const detail = await fetchPartnerTourDetail(apiBase, authHeaders, tourId);
        if (!detail) {
          console.warn("  skip tour", tourId, "— detail unavailable");
          continue;
        }

        const offers = await fetchPartnerTourOffers(apiBase, authHeaders, tourId);
        const apiReviews = await fetchPartnerTourReviews(apiBase, authHeaders, tourId);
        const publicPageData = await fetchPublicTourPageData(tourId, serpItem?.link);
        const row = mapTourRow(detail, serpItem, offers, publicPageData, apiReviews);
        if (!row) continue;
        rows.push(row);
        await pgUpsertTours(pg, [row]);

        await pgDeleteOffersForTour(pg, row.id);
        const offerRows = offers
          .map((offer, index) => mapOfferRow(row.id, offer, index))
          .filter((offer) => offer.startDate);
        offersUpserted += await pgUpsertOffers(pg, offerRows);
      } catch (error) {
        console.warn("  skip tour", tourId, "—", error.message);
      }
      await sleep(120);
    }

    const upserted = rows.length;

    await pgFinishSyncRun(pg, runId, {
      status: "success",
      toursFetched: discovered.size,
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
