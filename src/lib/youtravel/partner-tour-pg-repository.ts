import "server-only";

import { withPartnerPgClient } from "@/lib/partner-pg-pool";
import type { YouTravelOfferListingRow } from "@/lib/youtravel/offers-mapper";
import {
  applyYouTravelOfferPricesToListing,
  rowToListing,
  type YouTravelTourRow,
} from "@/lib/youtravel/partner-tour-repository";
import { filterFutureTourDates, isFutureOrTodayYmd } from "@/lib/partner-tours/offer-quality";
import type { TourDate, TourDetail, TourListing } from "@/types";

const LISTING_COLUMNS = `
  id, slug, title, country, region, city, status, duration_days, duration_nights,
  rating, review_count, price_value, price_currency, price_display, youtravel_url,
  partner_url, cover_image, photos, payload
`;

export async function pgFetchYouTravelTourListings(): Promise<TourListing[]> {
  return withPartnerPgClient(async (client) => {
    const { rows } = await client.query(
      `select ${LISTING_COLUMNS}
       from public.youtravel_tours
       where status is distinct from 'draft'
       order by review_count desc nulls last`,
    );
    const tours = rows as YouTravelTourRow[];
    if (!tours.length) return [];

    const tourIds = tours.map((tour) => tour.id);
    const offersResult = await client.query(
      `select tour_id, start_date, end_date, seats_available, price_value, price_currency, payload
       from public.youtravel_offers
       where tour_id = any($1::bigint[])
       order by start_date asc nulls last`,
      [tourIds],
    );

    const offersByTour = new Map<number, TourDate[]>();
    const offerPriceRowsByTour = new Map<number, YouTravelOfferListingRow[]>();
    for (const offer of offersResult.rows) {
      const tourId = Number(offer.tour_id);
      if (!Number.isFinite(tourId)) continue;

      if (offer.start_date) {
        const start = String(offer.start_date).slice(0, 10);
        if (isFutureOrTodayYmd(start)) {
          const list = offersByTour.get(tourId) ?? [];
          list.push({
            start,
            end: String(offer.end_date ?? offer.start_date).slice(0, 10),
            spotsLeft: Math.max(Number(offer.seats_available ?? 0), 0),
          });
          offersByTour.set(tourId, list);

          const priceRows = offerPriceRowsByTour.get(tourId) ?? [];
          priceRows.push({
            price_value: offer.price_value != null ? Number(offer.price_value) : null,
            price_currency: offer.price_currency ?? null,
            payload: {
              ...(offer.payload as object),
              startDate: start,
              dateFrom: start,
            } as YouTravelOfferListingRow["payload"],
          });
          offerPriceRowsByTour.set(tourId, priceRows);
          continue;
        }
      }

      const priceRows = offerPriceRowsByTour.get(tourId) ?? [];
      priceRows.push({
        price_value: offer.price_value != null ? Number(offer.price_value) : null,
        price_currency: offer.price_currency ?? null,
        payload: offer.payload as YouTravelOfferListingRow["payload"],
      });
      offerPriceRowsByTour.set(tourId, priceRows);
    }

    return tours.map((row) => {
      const listing = rowToListing(row);
      listing.availableDates = filterFutureTourDates(offersByTour.get(row.id) ?? []);
      return applyYouTravelOfferPricesToListing(
        listing,
        offerPriceRowsByTour.get(row.id) ?? [],
      );
    });
  });
}

export async function pgFetchYouTravelTourSlugs(): Promise<string[]> {
  return withPartnerPgClient(async (client) => {
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
  return withPartnerPgClient(async (client) => {
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
