#!/usr/bin/env node
/**
 * Sync Sputnik8 Argentina catalog into Supabase + generate Travelpayouts affiliate links.
 * Usage: npm run sputnik8:sync
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { resolveSyncCities, resolveSyncCountry } from "./sputnik8-argentina-resolver.mjs";
import {
  createPgClientFromEnv,
  pgFetchExistingProductIds,
  pgFinishSyncRun,
  pgInsertSyncRun,
  pgUpsertCities,
  pgUpsertCountry,
  pgUpsertProducts,
} from "./sputnik8-db-pg.mjs";
import {
  extractPhotosFromProduct,
  resolveCoverImage,
  resolveDurationMinutes,
  resolvePrice,
} from "./sputnik8-product-helpers.mjs";

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

function unwrapResults(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return (
    data.products ??
    data.cities ??
    data.countries ??
    data.reviews ??
    data.data ??
    data.results ??
    []
  );
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
  return normalized || "excursion";
}

function generateProductSlug(title, id) {
  return `${slugifyTitle(title)}-s${id}`;
}

const SPUTNIK8_CITY_SLUG_MAP = {
  "buenos-aires": "Buenos_Aires",
  buenos_aires: "Buenos_Aires",
  "buenos aires": "Buenos_Aires",
  ushuaia: "Ushuaia",
  mendoza: "Mendoza",
  "puerto-iguazu": "Puerto_Iguazu",
  puerto_iguazu: "Puerto_Iguazu",
  "puerto iguazu": "Puerto_Iguazu",
  "puerto-madryn": "Puerto_Madryn",
  puerto_madryn: "Puerto_Madryn",
  "puerto madryn": "Puerto_Madryn",
  bariloche: "Bariloche",
  salta: "Salta",
  cordoba: "Cordoba",
  "el-calafate": "El_Calafate",
  rosario: "Rosario",
};

const CITY_NAME_TO_CANONICAL_SLUG = {
  "buenos aires": "Buenos_Aires",
  "буэнос-айрес": "Buenos_Aires",
  ushuaia: "Ushuaia",
  ушуайя: "Ushuaia",
  mendoza: "Mendoza",
  мендоса: "Mendoza",
  "puerto iguazu": "Puerto_Iguazu",
  "пуэрто-игуасу": "Puerto_Iguazu",
  "puerto madryn": "Puerto_Madryn",
  "пуэрто-мадрин": "Puerto_Madryn",
};

function normalizeCityLookupKey(value) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function resolveCitySlugFromNames(...names) {
  for (const name of names) {
    if (!name?.trim()) continue;
    const hit = CITY_NAME_TO_CANONICAL_SLUG[normalizeCityLookupKey(name)];
    if (hit) return hit;
  }
  return null;
}

function resolveCitySlug(city) {
  const raw = city.slug?.trim();
  if (raw && !/^city-\d+$/i.test(raw)) {
    return SPUTNIK8_CITY_SLUG_MAP[raw.toLowerCase()] ?? raw;
  }
  return (
    resolveCitySlugFromNames(city.name_ru, city.name, city.name_en) ??
    raw ??
    `city-${city.id}`
  );
}

function resolveProductTitle(product) {
  return product.title?.trim() || product.name?.trim() || `Экскурсия ${product.id}`;
}

function resolveSputnik8Url(product, city) {
  if (product.url?.trim()) return product.url.trim();
  const citySlug = city ? resolveCitySlug(city) : "argentina";
  return `https://www.sputnik8.com/ru/${citySlug}/activities/${product.id}`;
}

async function sputnik8Get(apiKey, username, apiBase, resourcePath) {
  const separator = resourcePath.includes("?") ? "&" : "?";
  const url = `${apiBase}${resourcePath}${separator}api_key=${encodeURIComponent(apiKey)}&username=${encodeURIComponent(username)}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Sputnik8 ${resourcePath} failed (${response.status})`);
  }
  return body;
}

async function fetchAllProducts(apiKey, username, apiBase, cityId, lang, currency) {
  const collected = [];
  let page = 1;
  while (page <= 50) {
    const batch = await sputnik8Get(
      apiKey,
      username,
      apiBase,
      `/products?city_id=${cityId}&limit=100&page=${page}&lang=${lang}&currency=${currency}`
    );
    const list = unwrapResults(batch);
    collected.push(...list);
    if (!list.length || list.length < 100) break;
    page += 1;
  }
  return collected;
}

async function fetchProductReviews(apiKey, username, apiBase, productId) {
  try {
    const data = await sputnik8Get(apiKey, username, apiBase, `/products/${productId}/reviews`);
    return unwrapResults(data).slice(0, 20);
  } catch {
    return [];
  }
}

async function fetchProductDetail(apiKey, username, apiBase, productId, lang, currency) {
  return sputnik8Get(
    apiKey,
    username,
    apiBase,
    `/products/${productId}?lang=${lang}&currency=${currency}`
  );
}

function mergeSputnik8ProductSources(listProduct, detailProduct) {
  const detailPhotos = detailProduct.photos ?? detailProduct.images;
  const listPhotos = listProduct.photos ?? listProduct.images;

  return {
    ...listProduct,
    ...detailProduct,
    city_id: detailProduct.city_id ?? listProduct.city_id,
    photos: detailPhotos?.length ? detailPhotos : listPhotos,
    images: detailPhotos?.length ? detailPhotos : listPhotos,
    cover_photo: detailProduct.cover_photo ?? listProduct.cover_photo,
    description: detailProduct.description?.trim() || listProduct.description,
    short_info: detailProduct.short_info?.trim() || listProduct.short_info,
    important_info: detailProduct.important_info?.trim() || listProduct.important_info,
    refund_info: detailProduct.refund_info?.trim() || listProduct.refund_info,
    what_included: detailProduct.what_included ?? listProduct.what_included,
    what_not_included: detailProduct.what_not_included ?? listProduct.what_not_included,
    places_to_see: detailProduct.places_to_see?.trim() || listProduct.places_to_see,
    begin_place: detailProduct.begin_place ?? listProduct.begin_place,
    finish_point: detailProduct.finish_point ?? listProduct.finish_point,
    host: detailProduct.host ?? listProduct.host,
    guide: detailProduct.guide ?? listProduct.guide,
    group_size_max: detailProduct.group_size_max ?? listProduct.group_size_max,
    max_persons: detailProduct.max_persons ?? detailProduct.group_size_max ?? listProduct.max_persons,
    reviews_list: detailProduct.reviews_list?.length
      ? detailProduct.reviews_list
      : listProduct.reviews_list,
    order_options: detailProduct.order_options?.length
      ? detailProduct.order_options
      : listProduct.order_options,
  };
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createPartnerLinksBatch(links) {
  const apiKey = process.env.TRAVELPAYOUTS_API_KEY?.trim();
  const marker = process.env.TRAVELPAYOUTS_MARKER?.trim();
  const trs = process.env.TRAVELPAYOUTS_TRS?.trim();
  if (!apiKey || !marker || !trs) {
    throw new Error("Travelpayouts env incomplete (API_KEY, MARKER, TRS)");
  }

  const payload = {
    trs: Number(trs),
    marker: Number(marker),
    shorten: process.env.TRAVELPAYOUTS_SHORTEN_LINKS === "true",
    links,
  };

  const response = await fetch("https://api.travelpayouts.com/links/v1/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.result?.links?.length) {
    const detail =
      body?.error ||
      body?.result?.links?.[0]?.message ||
      (response.status === 429 ? "Too Many Requests" : `HTTP ${response.status}`);
    throw new Error(`Travelpayouts link batch failed (${response.status}): ${detail}`);
  }
  return body.result.links;
}

async function createPartnerLinksWithFallback(links) {
  try {
    return await createPartnerLinksBatch(links);
  } catch (batchError) {
    console.warn(String(batchError.message ?? batchError));
    console.warn("Retrying affiliate links one-by-one…");

    const results = [];
    for (const link of links) {
      try {
        const [result] = await createPartnerLinksBatch([link]);
        results.push(result ?? { partner_url: link.url, code: "fallback" });
      } catch {
        results.push({ partner_url: link.url, code: "fallback" });
      }
    }
    return results;
  }
}

function productToRow(product, countryId, city, slug, partnerUrl) {
  const price = resolvePrice(product);
  const photos = extractPhotosFromProduct(product);

  return {
    id: product.id,
    slug,
    country_id: countryId,
    city_id: city.id,
    title: resolveProductTitle(product),
    tagline: product.tagline ?? product.short_info ?? product.short_description ?? null,
    annotation: product.annotation ?? product.short_info ?? product.short_description ?? null,
    description: product.description ?? null,
    status: product.status ?? "active",
    experience_type: product.activity_type ?? product.type ?? null,
    format: product.format ?? null,
    duration_minutes: resolveDurationMinutes(product),
    rating: product.rating ?? null,
    review_count: product.reviews_count ?? product.review_count ?? 0,
    price_value: price.value,
    price_currency: price.currency,
    price_display: price.display,
    sputnik8_url: resolveSputnik8Url(product, city),
    partner_url: partnerUrl,
    cover_image: resolveCoverImage(product),
    photos,
    payload: product,
    synced_at: new Date().toISOString(),
  };
}

async function main() {
  loadEnvLocal();

  const apiKey = process.env.SPUTNIK8_API_KEY?.trim();
  const username = process.env.SPUTNIK8_USERNAME?.trim();
  const apiBase = (process.env.SPUTNIK8_API_BASE?.trim() || "https://api.sputnik8.com/v1").replace(/\/$/, "");
  const lang = process.env.SPUTNIK8_DEFAULT_LANG?.trim() || "ru";
  const currency = process.env.SPUTNIK8_DEFAULT_CURRENCY?.trim() || "USD";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!apiKey || !username) {
    console.error("Missing SPUTNIK8_API_KEY or SPUTNIK8_USERNAME");
    process.exit(1);
  }
  if (!serviceKey && !databaseUrl) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY or DATABASE_URL for sync storage");
    process.exit(1);
  }
  if (serviceKey && !supabaseUrl) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL");
    process.exit(1);
  }

  const supabase =
    serviceKey && supabaseUrl
      ? createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : null;
  const pgClient = supabase ? null : await createPgClientFromEnv();

  const log = [];
  const pushLog = (message) => {
    log.push({ at: new Date().toISOString(), message });
    console.log(message);
  };

  const { data: syncRun, error: syncRunError } = supabase
    ? await supabase.from("sputnik8_sync_runs").insert({ status: "running" }).select("id").single()
    : { data: { id: await pgInsertSyncRun(pgClient) }, error: null };

  if (syncRunError || !syncRun) {
    throw new Error(`Failed to create sync run: ${syncRunError?.message ?? "unknown"}`);
  }

  const syncRunId = syncRun.id;
  let citiesSynced = 0;
  let experiencesSynced = 0;
  let experiencesCreated = 0;
  let experiencesUpdated = 0;

  try {
    pushLog("Connecting to Sputnik8 API…");
    const sputnik8GetBound = (resourcePath) => sputnik8Get(apiKey, username, apiBase, resourcePath);

    const argentina = await resolveSyncCountry(sputnik8GetBound);
    if (!argentina) {
      throw new Error("Argentina not found in Sputnik8 API");
    }

    pushLog(`Country: ${argentina.name_ru ?? argentina.name_en ?? argentina.name} (id=${argentina.id})`);

    const countryRow = {
      id: argentina.id,
      slug: argentina.slug ?? null,
      name_ru: argentina.name_ru ?? argentina.name ?? null,
      name_en: argentina.name_en ?? argentina.name ?? null,
      currency: argentina.currency ?? null,
      experience_count: argentina.products_count ?? 0,
      payload: argentina,
    };

    if (supabase) {
      await supabase.from("sputnik8_countries").upsert(countryRow);
    } else {
      await pgUpsertCountry(pgClient, argentina);
    }

    const cities = await resolveSyncCities(sputnik8GetBound, argentina);
    pushLog(`Cities to sync: ${cities.length}`);

    const cityRows = cities.map((city) => ({
      id: city.id,
      country_id: argentina.id,
      slug: resolveCitySlug(city),
      name_ru: city.name_ru ?? city.name ?? null,
      name_en: city.name_en ?? city.name ?? null,
      experience_count: city.products_count ?? 0,
      cover_image: city.cover_image ?? city.image_url ?? city.photo_url ?? null,
      payload: city,
    }));

    if (cityRows.length) {
      if (supabase) {
        await supabase.from("sputnik8_cities").upsert(cityRows);
      } else {
        await pgUpsertCities(pgClient, cityRows);
      }
    }

    const existingById = supabase
      ? new Map(
          ((await supabase.from("sputnik8_products").select("id, slug")).data ?? []).map((row) => [
            row.id,
            row.slug,
          ])
        )
      : await pgFetchExistingProductIds(pgClient);

    const pendingLinks = [];
    const productRows = [];

    const skipDetailFetch = process.env.SPUTNIK8_SKIP_DETAIL_FETCH === "true";

    for (const city of cities) {
      citiesSynced += 1;
      pushLog(`Syncing city ${city.name_ru ?? city.name_en ?? city.name}…`);
      const products = await fetchAllProducts(apiKey, username, apiBase, city.id, lang, currency);
      pushLog(`  ${products.length} products`);

      for (const product of products) {
        let mergedProduct = product;
        if (!skipDetailFetch) {
          try {
            const detail = await fetchProductDetail(
              apiKey,
              username,
              apiBase,
              product.id,
              lang,
              currency
            );
            mergedProduct = mergeSputnik8ProductSources(product, detail);
            await sleep(120);
          } catch (error) {
            pushLog(`  detail fetch failed for product ${product.id}: ${error.message ?? error}`);
          }
        }

        const slug = generateProductSlug(resolveProductTitle(mergedProduct), mergedProduct.id);
        const sputnik8Url = resolveSputnik8Url(mergedProduct, city);

        pendingLinks.push({
          product: mergedProduct,
          city,
          slug,
          sputnik8Url,
          sub_id: `sputnik8:${resolveCitySlug(city)}:${mergedProduct.id}`,
        });
      }
    }

    const skipAffiliateLinks = process.env.SPUTNIK8_SKIP_AFFILIATE_LINKS === "true";
    const syncReviews = process.env.SPUTNIK8_SYNC_REVIEWS !== "false";

    if (!skipAffiliateLinks) {
      pushLog(`Generating affiliate links for ${pendingLinks.length} products…`);
      const partnerUrlByIndex = new Map();

      for (let i = 0; i < pendingLinks.length; i += 5) {
        const chunk = pendingLinks.slice(i, i + 5);
        const links = await createPartnerLinksWithFallback(
          chunk.map((item) => ({ url: item.sputnik8Url, sub_id: item.sub_id }))
        );
        links.forEach((link, index) => {
          partnerUrlByIndex.set(
            i + index,
            link.partner_url?.trim() || link.url?.trim() || pendingLinks[i + index]?.sputnik8Url || null
          );
        });
        await sleep(400);
      }

      for (let i = 0; i < pendingLinks.length; i += 1) {
        const item = pendingLinks[i];
        const partnerUrl = partnerUrlByIndex.get(i) ?? null;
        const row = productToRow(item.product, argentina.id, item.city, item.slug, partnerUrl);
        productRows.push(row);

        if (existingById.has(item.product.id)) experiencesUpdated += 1;
        else experiencesCreated += 1;
        experiencesSynced += 1;
      }
    } else {
      pushLog("Skipping affiliate link generation (SPUTNIK8_SKIP_AFFILIATE_LINKS=true)");
      for (const item of pendingLinks) {
        const row = productToRow(item.product, argentina.id, item.city, item.slug, null);
        productRows.push(row);
        if (existingById.has(item.product.id)) experiencesUpdated += 1;
        else experiencesCreated += 1;
        experiencesSynced += 1;
      }
    }

    if (supabase) {
      for (let i = 0; i < productRows.length; i += 100) {
        const chunk = productRows.slice(i, i + 100);
        const { error } = await supabase.from("sputnik8_products").upsert(chunk);
        if (error) throw new Error(`Upsert products failed: ${error.message}`);
      }
    } else {
      await pgUpsertProducts(pgClient, productRows);
    }

    pushLog(`Synced ${experiencesSynced} products (${experiencesCreated} new, ${experiencesUpdated} updated)`);

    if (syncReviews && productRows.length) {
      pushLog("Syncing reviews…");
      let reviewsSynced = 0;
      for (const row of productRows) {
        const reviews = await fetchProductReviews(apiKey, username, apiBase, row.id);
        if (!reviews.length) continue;

        if (supabase) {
          await supabase.from("sputnik8_reviews").delete().eq("product_id", row.id);
          await supabase.from("sputnik8_reviews").insert(
            reviews.map((review) => ({
              id: review.id,
              product_id: row.id,
              rating: review.rating ?? null,
              author_name: review.author_name ?? review.name ?? null,
              review_text: review.text ?? review.content ?? null,
              created_at: review.created_at ?? review.date ?? null,
              payload: review,
            }))
          );
        } else {
          await pgClient.query(`delete from public.sputnik8_reviews where product_id = $1`, [row.id]);
          for (const review of reviews) {
            await pgClient.query(
              `insert into public.sputnik8_reviews (id, product_id, rating, author_name, review_text, created_at, payload)
               values ($1,$2,$3,$4,$5,$6,$7::jsonb)
               on conflict (id) do update set
                 rating = excluded.rating,
                 author_name = excluded.author_name,
                 review_text = excluded.review_text,
                 created_at = excluded.created_at,
                 payload = excluded.payload,
                 synced_at = now()`,
              [
                review.id,
                row.id,
                review.rating ?? null,
                review.author_name ?? review.name ?? null,
                review.text ?? review.content ?? null,
                review.created_at ?? review.date ?? null,
                JSON.stringify(review),
              ]
            );
          }
        }
        reviewsSynced += reviews.length;
        await sleep(150);
      }
      pushLog(`Reviews synced: ${reviewsSynced}`);
    }

    const finishPayload = {
      status: "success",
      finished_at: new Date().toISOString(),
      cities_synced: citiesSynced,
      experiences_synced: experiencesSynced,
      experiences_created: experiencesCreated,
      experiences_updated: experiencesUpdated,
      log,
    };

    if (supabase) {
      await supabase.from("sputnik8_sync_runs").update(finishPayload).eq("id", syncRunId);
    } else {
      await pgFinishSyncRun(pgClient, syncRunId, finishPayload);
      await pgClient.end();
    }
  } catch (error) {
    const message = error.message ?? String(error);
    pushLog(`Sync failed: ${message}`);
    const failPayload = {
      status: "failed",
      finished_at: new Date().toISOString(),
      cities_synced: citiesSynced,
      experiences_synced: experiencesSynced,
      experiences_created: experiencesCreated,
      experiences_updated: experiencesUpdated,
      error_message: message,
      log,
    };

    if (supabase) {
      await supabase.from("sputnik8_sync_runs").update(failPayload).eq("id", syncRunId);
    } else {
      await pgFinishSyncRun(pgClient, syncRunId, failPayload);
      await pgClient.end();
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
