import pg from "pg";

const { Client } = pg;

export function createPgClientFromEnv() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for YouTravel sync");
  }
  return new Client({ connectionString, ssl: { rejectUnauthorized: false } });
}

export async function pgInsertSyncRun(client, input = {}) {
  const { rows } = await client.query(
    `insert into public.youtravel_sync_runs (status, payload)
     values ('running', $1::jsonb)
     returning id`,
    [JSON.stringify(input)]
  );
  return rows[0]?.id;
}

export async function pgFinishSyncRun(client, runId, input) {
  await client.query(
    `update public.youtravel_sync_runs
     set finished_at = now(),
         status = $2,
         tours_fetched = $3,
         tours_upserted = $4,
         offers_upserted = $5,
         error_message = $6
     where id = $1`,
    [
      runId,
      input.status,
      input.toursFetched ?? 0,
      input.toursUpserted ?? 0,
      input.offersUpserted ?? 0,
      input.errorMessage ?? null,
    ]
  );
}

export async function pgUpsertOffers(client, offers) {
  if (!offers.length) return 0;

  let upserted = 0;
  for (const offer of offers) {
    await client.query(
      `insert into public.youtravel_offers (
         id, tour_id, start_date, end_date, price_value, price_currency, seats_available, payload, synced_at
       ) values (
         $1, $2, $3, $4, $5, $6, $7, $8::jsonb, now()
       )
       on conflict (id) do update set
         tour_id = excluded.tour_id,
         start_date = excluded.start_date,
         end_date = excluded.end_date,
         price_value = excluded.price_value,
         price_currency = excluded.price_currency,
         seats_available = excluded.seats_available,
         payload = excluded.payload,
         synced_at = now(),
         updated_at = now()`,
      [
        offer.id,
        offer.tourId,
        offer.startDate,
        offer.endDate,
        offer.priceValue,
        offer.priceCurrency,
        offer.seatsAvailable,
        JSON.stringify(offer.payload ?? {}),
      ]
    );
    upserted += 1;
  }

  return upserted;
}

export async function pgDeleteOffersForTour(client, tourId) {
  await client.query(`delete from public.youtravel_offers where tour_id = $1`, [tourId]);
}

export async function pgUpsertTours(client, tours) {
  if (!tours.length) return 0;

  let upserted = 0;
  for (const tour of tours) {
    await client.query(
      `insert into public.youtravel_tours (
         id, slug, title, country, region, city, status,
         duration_days, duration_nights, rating, review_count,
         price_value, price_currency, price_display,
         youtravel_url, partner_url, cover_image, photos, payload, synced_at
       ) values (
         $1, $2, $3, $4, $5, $6, $7,
         $8, $9, $10, $11,
         $12, $13, $14,
         $15, $16, $17, $18::jsonb, $19::jsonb, now()
       )
       on conflict (id) do update set
         slug = excluded.slug,
         title = excluded.title,
         country = excluded.country,
         region = excluded.region,
         city = excluded.city,
         status = excluded.status,
         duration_days = excluded.duration_days,
         duration_nights = excluded.duration_nights,
         rating = excluded.rating,
         review_count = excluded.review_count,
         price_value = excluded.price_value,
         price_currency = excluded.price_currency,
         price_display = excluded.price_display,
         youtravel_url = excluded.youtravel_url,
         partner_url = coalesce(excluded.partner_url, public.youtravel_tours.partner_url),
         cover_image = excluded.cover_image,
         photos = excluded.photos,
         payload = excluded.payload,
         synced_at = now(),
         updated_at = now()`,
      [
        tour.id,
        tour.slug,
        tour.title,
        tour.country,
        tour.region,
        tour.city,
        tour.status,
        tour.durationDays,
        tour.durationNights,
        tour.rating,
        tour.reviewCount,
        tour.priceValue,
        tour.priceCurrency,
        tour.priceDisplay,
        tour.youtravelUrl,
        tour.partnerUrl,
        tour.coverImage,
        JSON.stringify(tour.photos ?? []),
        JSON.stringify(tour.payload ?? {}),
      ]
    );
    upserted += 1;
  }

  return upserted;
}
