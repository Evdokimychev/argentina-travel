import pg from "pg";
import { resolveSupabaseDatabaseUrl } from "./supabase-resolve-db-url.mjs";

export async function createPgClientFromEnv() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing in .env.local");
  }

  const resolvedUrl = await resolveSupabaseDatabaseUrl(connectionString);
  const client = new pg.Client({
    connectionString: resolvedUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}

export async function pgInsertSyncRun(client) {
  const { rows } = await client.query(
    `insert into public.sputnik8_sync_runs (status) values ('running') returning id`
  );
  return rows[0].id;
}

export async function pgFinishSyncRun(client, syncRunId, payload) {
  await client.query(
    `update public.sputnik8_sync_runs
     set status = $2,
         finished_at = $3,
         cities_synced = $4,
         experiences_synced = $5,
         experiences_created = $6,
         experiences_updated = $7,
         error_message = $8,
         log = $9::jsonb
     where id = $1`,
    [
      syncRunId,
      payload.status,
      payload.finished_at,
      payload.cities_synced,
      payload.experiences_synced,
      payload.experiences_created,
      payload.experiences_updated,
      payload.error_message ?? null,
      JSON.stringify(payload.log ?? []),
    ]
  );
}

export async function pgUpsertCountry(client, country) {
  await client.query(
    `insert into public.sputnik8_countries (id, slug, name_ru, name_en, currency, experience_count, payload)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb)
     on conflict (id) do update set
       slug = excluded.slug,
       name_ru = excluded.name_ru,
       name_en = excluded.name_en,
       currency = excluded.currency,
       experience_count = excluded.experience_count,
       payload = excluded.payload,
       updated_at = now()`,
    [
      country.id,
      country.slug ?? null,
      country.name_ru ?? country.name ?? null,
      country.name_en ?? country.name ?? null,
      country.currency ?? null,
      country.products_count ?? country.experience_count ?? 0,
      JSON.stringify(country),
    ]
  );
}

export async function pgUpsertCities(client, cityRows) {
  for (const city of cityRows) {
    await client.query(
      `insert into public.sputnik8_cities (id, country_id, slug, name_ru, name_en, experience_count, cover_image, payload)
       values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       on conflict (id) do update set
         country_id = excluded.country_id,
         slug = excluded.slug,
         name_ru = excluded.name_ru,
         name_en = excluded.name_en,
         experience_count = excluded.experience_count,
         cover_image = excluded.cover_image,
         payload = excluded.payload,
         updated_at = now()`,
      [
        city.id,
        city.country_id,
        city.slug,
        city.name_ru ?? null,
        city.name_en ?? null,
        city.experience_count ?? 0,
        city.cover_image ?? null,
        JSON.stringify(city.payload ?? city),
      ]
    );
  }
}

export async function pgFetchExistingProductIds(client) {
  const { rows } = await client.query(`select id, slug from public.sputnik8_products`);
  return new Map(rows.map((row) => [row.id, row.slug]));
}

export async function pgUpsertProducts(client, rows) {
  for (const row of rows) {
    await client.query(
      `insert into public.sputnik8_products (
         id, slug, country_id, city_id, title, tagline, annotation, description, status,
         experience_type, format, duration_minutes, rating, review_count, price_value,
         price_currency, price_display, sputnik8_url, partner_url, cover_image, photos, payload, synced_at
       ) values (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21::jsonb,$22::jsonb,now()
       )
       on conflict (id) do update set
         slug = excluded.slug,
         country_id = excluded.country_id,
         city_id = excluded.city_id,
         title = excluded.title,
         tagline = excluded.tagline,
         annotation = excluded.annotation,
         description = excluded.description,
         status = excluded.status,
         experience_type = excluded.experience_type,
         format = excluded.format,
         duration_minutes = excluded.duration_minutes,
         rating = excluded.rating,
         review_count = excluded.review_count,
         price_value = excluded.price_value,
         price_currency = excluded.price_currency,
         price_display = excluded.price_display,
         sputnik8_url = excluded.sputnik8_url,
         partner_url = excluded.partner_url,
         cover_image = excluded.cover_image,
         photos = excluded.photos,
         payload = excluded.payload,
         synced_at = now(),
         updated_at = now()`,
      [
        row.id,
        row.slug,
        row.country_id,
        row.city_id,
        row.title,
        row.tagline,
        row.annotation,
        row.description,
        row.status,
        row.experience_type,
        row.format,
        row.duration_minutes,
        row.rating,
        row.review_count,
        row.price_value,
        row.price_currency,
        row.price_display,
        row.sputnik8_url,
        row.partner_url,
        row.cover_image,
        JSON.stringify(row.photos ?? []),
        JSON.stringify(row.payload ?? {}),
      ]
    );
  }
}
