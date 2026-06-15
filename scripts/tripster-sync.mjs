#!/usr/bin/env node
/**
 * Sync Tripster Argentina catalog into Supabase + generate Travelpayouts affiliate links.
 * Usage: npm run tripster:sync
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { resolveSyncCities, resolveSyncCountry } from "./tripster-argentina-resolver.mjs";
import {
  createPgClientFromEnv,
  pgFetchExistingExperienceIds,
  pgFinishSyncRun,
  pgInsertSyncRun,
  pgUpsertCities,
  pgUpsertCountry,
  pgUpsertExperiences,
} from "./tripster-db-pg.mjs";

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
  return Array.isArray(data) ? data : data.results ?? [];
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

function generateExperienceSlug(title, id) {
  return `${slugifyTitle(title)}-t${id}`;
}

function resolveCoverImage(experience) {
  const first = experience.photos?.[0];
  return first?.medium || first?.thumbnail || experience.city?.image?.cover || null;
}

async function obtainToken(partner, secret, apiBase) {
  const response = await fetch(`${apiBase}/auth/obtain_token/partner/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ partner, secret }),
  });
  const body = await response.json();
  if (!response.ok || !body?.token) {
    throw new Error(`Tripster auth failed (${response.status})`);
  }
  return body.token;
}

async function tripsterGet(token, partner, apiBase, resourcePath) {
  const response = await fetch(
    `${apiBase}/partners/${encodeURIComponent(partner)}${resourcePath}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Tripster ${resourcePath} failed (${response.status})`);
  }
  return body;
}

async function fetchExperienceReviews(token, partner, apiBase, experienceId) {
  try {
    const data = await tripsterGet(
      token,
      partner,
      apiBase,
      `/experiences/${experienceId}/reviews/?page=1&page_size=5`
    );
    return unwrapResults(data);
  } catch {
    return [];
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAllExperiences(token, partner, apiBase, cityId) {
  const collected = [];
  let page = 1;
  while (page <= 200) {
    const batch = await tripsterGet(
      token,
      partner,
      apiBase,
      `/experiences/?city=${cityId}&page=${page}&page_size=100&detailed=true`
    );
    const list = unwrapResults(batch);
    collected.push(...list);
    if (!batch.next) break;
    page += 1;
  }
  return collected;
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

function experienceToRow(experience, countryId, city, slug, partnerUrl) {
  const price = experience.price ?? {};
  return {
    id: experience.id,
    slug,
    country_id: countryId,
    city_id: city.id,
    title: experience.title?.trim() || `Экскурсия ${experience.id}`,
    tagline: experience.tagline ?? null,
    annotation: experience.annotation ?? null,
    description: experience.description ?? null,
    status: experience.status ?? null,
    experience_type: experience.type ?? null,
    format: experience.format ?? null,
    duration_minutes:
      experience.duration != null ? Math.round(Number(experience.duration) * 60) : null,
    rating: experience.rating ?? null,
    review_count: experience.review_count ?? 0,
    price_value: price.value ?? null,
    price_currency: price.currency ?? null,
    price_display: price.value_string ?? null,
    tripster_url:
      experience.url?.trim() || `https://experience.tripster.ru/experience/${experience.id}/`,
    partner_url: partnerUrl,
    cover_image: resolveCoverImage(experience),
    photos: (experience.photos ?? []).map((photo) => ({
      thumbnail: photo.thumbnail,
      medium: photo.medium,
      type: photo.type,
    })),
    payload: experience,
    synced_at: new Date().toISOString(),
  };
}

async function main() {
  loadEnvLocal();

  const partner = process.env.TRIPSTER_PARTNER?.trim();
  const secret = process.env.TRIPSTER_SECRET?.trim();
  const apiBase = (process.env.TRIPSTER_API_BASE?.trim() || "https://experience.tripster.ru/api").replace(
    /\/$/,
    ""
  );
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!partner || !secret) {
    console.error("Missing TRIPSTER_PARTNER or TRIPSTER_SECRET");
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
    ? await supabase.from("tripster_sync_runs").insert({ status: "running" }).select("id").single()
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
    pushLog("Authenticating with Tripster…");
    const token = await obtainToken(partner, secret, apiBase);

    const tripsterGetBound = (resourcePath) => tripsterGet(token, partner, apiBase, resourcePath);

    const argentina = await resolveSyncCountry(tripsterGetBound);
    if (!argentina) {
      throw new Error("Argentina not found in Tripster API (tried filters, pagination, site search)");
    }

    pushLog(`Country: ${argentina.name_ru ?? argentina.name_en} (id=${argentina.id})`);

    if (supabase) {
      await supabase.from("tripster_countries").upsert({
        id: argentina.id,
        slug: argentina.slug ?? null,
        name_ru: argentina.name_ru ?? null,
        name_en: argentina.name_en ?? null,
        currency: argentina.currency ?? null,
        experience_count: argentina.experience_count ?? 0,
        payload: argentina,
      });
    } else {
      await pgUpsertCountry(pgClient, argentina);
    }

    const cities = await resolveSyncCities(tripsterGetBound, argentina);
    pushLog(`Cities to sync: ${cities.length}`);

    const cityRows = cities.map((city) => ({
      id: city.id,
      country_id: argentina.id,
      slug: city.slug?.trim() || `city-${city.id}`,
      name_ru: city.name_ru ?? null,
      name_en: city.name_en ?? null,
      experience_count: city.experience_count ?? 0,
      cover_image: city.image?.cover ?? city.image?.thumbnail ?? null,
      payload: city,
    }));

    if (cityRows.length) {
      if (supabase) {
        await supabase.from("tripster_cities").upsert(cityRows);
      } else {
        await pgUpsertCities(pgClient, cityRows);
      }
    }

    const existingById = supabase
      ? new Map(
          ((await supabase.from("tripster_experiences").select("id, slug")).data ?? []).map((row) => [
            row.id,
            row.slug,
          ])
        )
      : await pgFetchExistingExperienceIds(pgClient);

    const pendingLinks = [];
    const experienceRows = [];

    for (const city of cities) {
      citiesSynced += 1;
      pushLog(`Syncing city ${city.name_ru ?? city.name_en}…`);
      const experiences = await fetchAllExperiences(token, partner, apiBase, city.id);
      pushLog(`  ${experiences.length} experiences`);

      for (const experience of experiences) {
        const slug = generateExperienceSlug(
          experience.title?.trim() || `excursion-${experience.id}`,
          experience.id
        );
        const tripsterUrl =
          experience.url?.trim() || `https://experience.tripster.ru/experience/${experience.id}/`;

        pendingLinks.push({
          experience,
          city,
          slug,
          tripsterUrl,
          sub_id: `tripster:${city.slug ?? city.id}:${experience.id}`,
        });
      }
    }

    const skipAffiliateLinks = process.env.TRIPSTER_SKIP_AFFILIATE_LINKS === "true";
    const syncReviews = process.env.TRIPSTER_SYNC_REVIEWS !== "false";

    if (!skipAffiliateLinks) {
      pushLog(`Generating affiliate links for ${pendingLinks.length} experiences…`);
      const partnerUrlByIndex = new Map();

      for (let i = 0; i < pendingLinks.length; i += 5) {
        const chunk = pendingLinks.slice(i, i + 5);
        const links = await createPartnerLinksWithFallback(
          chunk.map((item) => ({ url: item.tripsterUrl, sub_id: item.sub_id }))
        );
        links.forEach((link, index) => {
          partnerUrlByIndex.set(
            i + index,
            link.partner_url?.trim() || link.url?.trim() || pendingLinks[i + index]?.tripsterUrl || null
          );
        });
        await sleep(400);
      }

      for (let i = 0; i < pendingLinks.length; i += 1) {
        const item = pendingLinks[i];
        const partnerUrl = partnerUrlByIndex.get(i) ?? null;
        const row = experienceToRow(
          item.experience,
          argentina.id,
          item.city,
          item.slug,
          partnerUrl
        );
        experienceRows.push(row);

        if (existingById.has(item.experience.id)) {
          experiencesUpdated += 1;
        } else {
          experiencesCreated += 1;
        }
        experiencesSynced += 1;
      }
    } else {
      pushLog("Skipping affiliate link generation (TRIPSTER_SKIP_AFFILIATE_LINKS=true)");
      for (const item of pendingLinks) {
        const row = experienceToRow(item.experience, argentina.id, item.city, item.slug, null);
        experienceRows.push(row);
        if (existingById.has(item.experience.id)) experiencesUpdated += 1;
        else experiencesCreated += 1;
        experiencesSynced += 1;
      }
    }

    if (supabase) {
      for (let i = 0; i < experienceRows.length; i += 100) {
        const chunk = experienceRows.slice(i, i + 100);
        const { error } = await supabase.from("tripster_experiences").upsert(chunk);
        if (error) throw new Error(`Upsert experiences failed: ${error.message}`);
      }
    } else {
      await pgUpsertExperiences(pgClient, experienceRows);
    }

    pushLog(`Synced ${experiencesSynced} experiences (${experiencesCreated} new, ${experiencesUpdated} updated)`);

    if (syncReviews && experienceRows.length) {
      pushLog("Syncing reviews…");
      let reviewsSynced = 0;
      for (const row of experienceRows) {
        const reviews = await fetchExperienceReviews(token, partner, apiBase, row.id);
        if (!reviews.length) continue;

        if (supabase) {
          await supabase.from("tripster_reviews").delete().eq("experience_id", row.id);
          await supabase.from("tripster_reviews").insert(
            reviews.map((review) => ({
              id: review.id,
              experience_id: row.id,
              rating: review.rating ?? null,
              author_name: review.name ?? review.author?.name ?? null,
              review_text: review.text ?? null,
              created_at: review.created_at ?? null,
              payload: review,
            }))
          );
        } else {
          await pgClient.query(`delete from public.tripster_reviews where experience_id = $1`, [row.id]);
          for (const review of reviews) {
            await pgClient.query(
              `insert into public.tripster_reviews (id, experience_id, rating, author_name, review_text, created_at, payload)
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
                review.name ?? review.author?.name ?? null,
                review.text ?? null,
                review.created_at ?? null,
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
      await supabase.from("tripster_sync_runs").update(finishPayload).eq("id", syncRunId);
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
      await supabase.from("tripster_sync_runs").update(failPayload).eq("id", syncRunId);
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
