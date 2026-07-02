import "server-only";

import pg from "pg";
import {
  partnerTourRowToDetail,
  partnerTourRowToListing,
  type PartnerTourExperienceRow,
} from "@/lib/tripster/partner-tour-mapper";
import { TRIPSTER_TOUR_WHERE_SQL } from "@/lib/tripster/partner-tour-utils";
import { isPartnerTourExperiencePublishable } from "@/lib/tripster/partner-tour-visibility";
import { resolveDatabaseUrl, createPgClientConfig } from "@/lib/database-url";
import type { TourDetail, TourListing } from "@/types";

async function withPgClient<T>(fn: (client: pg.Client) => Promise<T>): Promise<T | null> {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) return null;

  const client = new pg.Client(createPgClientConfig(connectionString));

  try {
    await client.connect();
    return await fn(client);
  } catch {
    return null;
  } finally {
    await client.end().catch(() => undefined);
  }
}

type CityRow = {
  id: number;
  slug: string;
  name_ru: string | null;
  name_en: string | null;
  experience_count: number;
  cover_image: string | null;
};

async function loadCities(client: pg.Client): Promise<Map<number, CityRow>> {
  const { rows } = await client.query(
    `select id, slug, name_ru, name_en, experience_count, cover_image
     from public.tripster_cities
     order by experience_count desc`
  );
  return new Map(rows.map((row) => [row.id as number, row as CityRow]));
}

export async function pgFetchPartnerTourListings(): Promise<TourListing[]> {
  const result = await withPgClient(async (client) => {
    const cityMap = await loadCities(client);
    const { rows } = await client.query(
      `select id, slug, country_id, city_id, title, tagline, annotation, description,
              status, experience_type, format, duration_minutes, rating, review_count,
              price_value, price_currency, price_display, tripster_url, partner_url,
              cover_image, photos, payload
       from public.tripster_experiences
       where ${TRIPSTER_TOUR_WHERE_SQL}
       order by review_count desc nulls last`
    );

    return rows
      .filter((row) => isPartnerTourExperiencePublishable(row as PartnerTourExperienceRow))
      .map((row) => {
      const city = cityMap.get(row.city_id as number) ?? null;
      return partnerTourRowToListing(row as PartnerTourExperienceRow, city);
    });
  });

  return result ?? [];
}

export async function pgFetchPartnerTourDetail(slug: string): Promise<TourDetail | null> {
  const result = await withPgClient(async (client) => {
    const experience = await client.query(
      `select * from public.tripster_experiences where slug = $1 and ${TRIPSTER_TOUR_WHERE_SQL} limit 1`,
      [slug]
    );
    const row = experience.rows[0] as PartnerTourExperienceRow | undefined;
    if (!row || !isPartnerTourExperiencePublishable(row)) return null;

    const cityResult = await client.query(
      `select id, slug, name_ru, name_en, experience_count, cover_image
       from public.tripster_cities where id = $1 limit 1`,
      [row.city_id]
    );
    const city = (cityResult.rows[0] as CityRow | undefined) ?? null;

    const reviewsResult = await client.query(
      `select id, rating, author_name, review_text, created_at, payload
       from public.tripster_reviews where experience_id = $1
       order by created_at desc nulls last limit 50`,
      [row.id]
    );

    return partnerTourRowToDetail(row, city, { reviews: reviewsResult.rows });
  });

  return result;
}

export async function pgFetchPartnerTourSlugs(): Promise<string[]> {
  const result = await withPgClient(async (client) => {
    const { rows } = await client.query(
      `select slug, status, payload from public.tripster_experiences where ${TRIPSTER_TOUR_WHERE_SQL} order by slug`
    );
    return rows
      .filter((row) => isPartnerTourExperiencePublishable(row as PartnerTourExperienceRow))
      .map((row) => row.slug as string);
  });
  return result ?? [];
}
