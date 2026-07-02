import "server-only";

import pg from "pg";
import {
  rowToExcursionCity,
  rowToExcursionDetail,
  rowToExcursionListing,
  mapSputnik8ReviewRow,
} from "@/lib/sputnik8/mapper";
import { enrichSputnik8ExcursionDetail } from "@/lib/sputnik8/detail-enrichment";
import { resolveDatabaseUrl } from "@/lib/database-url";
import type {
  ExcursionCity,
  ExcursionDetail,
  ExcursionListFilters,
  ExcursionListResult,
  ExcursionListing,
} from "@/types/excursion";

async function withPgClient<T>(fn: (client: pg.Client) => Promise<T>): Promise<T | null> {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) return null;

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    return await fn(client);
  } catch {
    return null;
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function pgFetchSputnik8ExcursionCities(): Promise<ExcursionCity[]> {
  const result = await withPgClient(async (client) => {
    const { rows } = await client.query(
      `select id, slug, name_ru, name_en, experience_count, cover_image
       from public.sputnik8_cities
       order by experience_count desc`
    );
    return rows.map((row) => rowToExcursionCity(row));
  });
  return result ?? [];
}

export async function pgFetchSputnik8ExcursionsServer(
  filters: ExcursionListFilters = {}
): Promise<ExcursionListResult | null> {
  return withPgClient(async (client) => {
    const cities = (
      await client.query(
        `select id, slug, name_ru, name_en, experience_count, cover_image
         from public.sputnik8_cities
         order by experience_count desc`
      )
    ).rows.map((row) => rowToExcursionCity(row));

    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(48, Math.max(1, filters.pageSize ?? 24));
    const params: unknown[] = [];
    const where: string[] = [];

    if (filters.citySlug) {
      const city = cities.find((item) => item.slug === filters.citySlug);
      if (!city) return { items: [], total: 0, page, pageSize, cities };
      params.push(city.id);
      where.push(`city_id = $${params.length}`);
    }

    if (filters.query?.trim()) {
      params.push(`%${filters.query.trim()}%`);
      where.push(`(title ilike $${params.length} or tagline ilike $${params.length})`);
    }

    const whereSql = where.length ? `where ${where.join(" and ")}` : "";
    const orderSql =
      filters.sort === "rating"
        ? "order by rating desc nulls last"
        : filters.sort === "price_asc"
          ? "order by price_value asc nulls last"
          : filters.sort === "price_desc"
            ? "order by price_value desc nulls last"
            : "order by review_count desc";

    const countResult = await client.query(
      `select count(*)::int as total from public.sputnik8_products ${whereSql}`,
      params
    );
    const total = countResult.rows[0]?.total ?? 0;

    params.push(pageSize, (page - 1) * pageSize);
    const { rows } = await client.query(
      `select id, slug, country_id, city_id, title, tagline, rating, review_count,
              price_value, price_currency, price_display, duration_minutes, format, cover_image, payload
       from public.sputnik8_products
       ${whereSql}
       ${orderSql}
       limit $${params.length - 1} offset $${params.length}`,
      params
    );

    const cityMap = new Map(cities.map((city) => [city.id, city]));
    const items = rows.map((row) => {
      const city = cityMap.get(row.city_id);
      const cityRow = city
        ? {
            id: city.id,
            slug: city.slug,
            name_ru: city.name,
            name_en: null,
            experience_count: city.experienceCount,
            cover_image: city.coverImage ?? null,
          }
        : null;
      return rowToExcursionListing(row, cityRow);
    });

    return { items, total, page, pageSize, cities };
  });
}

export async function pgFetchSputnik8ExcursionDetailServer(slug: string): Promise<ExcursionDetail | null> {
  const fetched = await withPgClient(async (client) => {
    const product = await client.query(`select * from public.sputnik8_products where slug = $1 limit 1`, [
      slug,
    ]);
    const row = product.rows[0];
    if (!row) return null;

    const city = await client.query(
      `select id, slug, name_ru, name_en, experience_count, cover_image
       from public.sputnik8_cities where id = $1 limit 1`,
      [row.city_id]
    );

    return {
      detail: rowToExcursionDetail(row, city.rows[0] ?? null),
      payload: row.payload,
      city: city.rows[0] ?? null,
    };
  });

  if (!fetched) return null;

  const enriched = await enrichSputnik8ExcursionDetail(
    fetched.detail,
    fetched.detail.id,
    fetched.payload,
    fetched.city
  );

  const reviewsResult = await withPgClient(async (client) => {
    const { rows } = await client.query(
      `select id, rating, author_name, review_text, created_at, payload
       from public.sputnik8_reviews where product_id = $1
       order by created_at desc nulls last limit 20`,
      [fetched.detail.id]
    );
    return rows.map((row) => mapSputnik8ReviewRow(row));
  });

  const mergedReviews =
    reviewsResult && reviewsResult.length > 0
      ? reviewsResult
      : enriched.reviews && enriched.reviews.length > 0
        ? enriched.reviews
        : reviewsResult ?? [];

  return { ...enriched, reviews: mergedReviews };
}

export async function pgFetchSputnik8ExcursionSlugsServer(): Promise<string[]> {
  const result = await withPgClient(async (client) => {
    const { rows } = await client.query(`select slug from public.sputnik8_products order by slug`);
    return rows.map((row) => row.slug as string);
  });
  return result ?? [];
}

export async function pgFetchSimilarSputnik8Excursions(
  cityId: number,
  excludeId: number,
  limit = 6
): Promise<ExcursionListing[]> {
  const result = await withPgClient(async (client) => {
    const cities = (
      await client.query(
        `select id, slug, name_ru, name_en, experience_count, cover_image
         from public.sputnik8_cities
         order by experience_count desc`
      )
    ).rows.map((row) => rowToExcursionCity(row));

    const { rows } = await client.query(
      `select id, slug, country_id, city_id, title, tagline, rating, review_count,
              price_value, price_currency, price_display, duration_minutes, format, cover_image, payload
       from public.sputnik8_products
       where city_id = $1 and id <> $2
       order by review_count desc
       limit $3`,
      [cityId, excludeId, limit]
    );

    const cityMap = new Map(cities.map((city) => [city.id, city]));
    return rows.map((row) => {
      const city = cityMap.get(row.city_id);
      const cityRow = city
        ? {
            id: city.id,
            slug: city.slug,
            name_ru: city.name,
            name_en: null,
            experience_count: city.experienceCount,
            cover_image: city.coverImage ?? null,
          }
        : null;
      return rowToExcursionListing(row, cityRow);
    });
  });

  return result ?? [];
}
