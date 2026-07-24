import "server-only";

import pg from "pg";
import { resolveDatabaseUrl, createPgClientConfig } from "@/lib/database-url";
import {
  rowToListing,
  type YouTravelTourRow,
} from "@/lib/youtravel/partner-tour-repository";
import type { TourDetail, TourListing } from "@/types";

async function withPgClient<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    throw new Error("Direct Postgres is not configured for YouTravel fallback");
  }

  const client = new pg.Client(createPgClientConfig(connectionString));

  try {
    await client.connect();
    return await fn(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

const LISTING_COLUMNS = `
  id, slug, title, country, region, city, status, duration_days, duration_nights,
  rating, review_count, price_value, price_currency, price_display, youtravel_url,
  partner_url, cover_image, photos, payload
`;

export async function pgFetchYouTravelTourListings(): Promise<TourListing[]> {
  return withPgClient(async (client) => {
    const { rows } = await client.query(
      `select ${LISTING_COLUMNS}
       from public.youtravel_tours
       where status is distinct from 'draft'
       order by review_count desc nulls last`,
    );
    return (rows as YouTravelTourRow[]).map((row) => rowToListing(row));
  });
}

export async function pgFetchYouTravelTourSlugs(): Promise<string[]> {
  return withPgClient(async (client) => {
    const { rows } = await client.query<{ slug: string }>(
      `select slug
       from public.youtravel_tours
       where status is distinct from 'draft'
       order by slug`,
    );
    return rows.map((row) => row.slug);
  });
}

export async function pgFetchYouTravelTourDetail(
  slug: string,
): Promise<TourDetail | null> {
  return withPgClient(async (client) => {
    const tourResult = await client.query(
      `select * from public.youtravel_tours where slug = $1 limit 1`,
      [slug],
    );
    const row = tourResult.rows[0] as YouTravelTourRow | undefined;
    if (!row || row.status === "draft") return null;

    const offersResult = await client.query(
      `select id, tour_id, start_date, end_date, price_value, price_currency, seats_available, payload
       from public.youtravel_offers
       where tour_id = $1
       order by start_date asc nulls last`,
      [row.id],
    );

    const { youtravelRowToDetail } = await import("@/lib/youtravel/partner-tour-mapper");
    return youtravelRowToDetail(row, {
      offers: offersResult.rows.map((offer) => ({
        id: offer.id,
        tourId: offer.tour_id,
        startDate: offer.start_date ?? undefined,
        endDate: offer.end_date ?? undefined,
        price: offer.price_value ?? undefined,
        currency: offer.price_currency ?? undefined,
        seatsAvailable: offer.seats_available ?? undefined,
        payload: offer.payload,
      })),
    });
  });
}
