import type { Json, TourRow } from "@/types/database";
import type { TourListing } from "@/types";
import type { Tour, TourStatus } from "@/types/tour";
import type { TourContentAdminSummary, TourContentStatus } from "@/types/tour-content";
import { tourToDetail, tourToListing } from "@/lib/tour-mapper";
import { PRIMARY_PUBLIC_MARKET } from "@/lib/market-context";

const CONTENT_STATUSES: TourContentStatus[] = ["draft", "published", "archived"];

function parseContentStatus(value: string): TourContentStatus {
  return CONTENT_STATUSES.includes(value as TourContentStatus)
    ? (value as TourContentStatus)
    : "draft";
}

export function tourStatusToContentStatus(status: TourStatus): TourContentStatus {
  if (status === "published") return "published";
  if (status === "archived" || status === "deleted") return "archived";
  return "draft";
}

export function parseTourPayload(payload: Json): Tour | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const candidate = payload as Partial<Tour>;
  if (!candidate.id || !candidate.slug || !candidate.title) return null;
  return candidate as Tour;
}

export function rowToTour(row: TourRow): Tour | null {
  return parseTourPayload(row.payload);
}

export function rowToPublicTour(row: TourRow): Tour | null {
  if (row.moderation_status === "pending" || row.moderation_status === "rejected") {
    return row.approved_payload ? parseTourPayload(row.approved_payload) : null;
  }
  return parseTourPayload(row.payload);
}

export function rowToTourListing(row: TourRow): TourListing | null {
  if (row.listing && typeof row.listing === "object" && !Array.isArray(row.listing)) {
    const listing = row.listing as unknown as TourListing;
    if (listing.slug && listing.title) {
      return {
        ...listing,
        productType: row.product_type === "excursion" ? "excursion" : "tour",
      };
    }
  }

  const tour = rowToTour(row);
  return tour ? tourToListing(tour) : null;
}

export function rowToPublicTourListing(row: TourRow): TourListing | null {
  if (
    (row.moderation_status === "pending" || row.moderation_status === "rejected") &&
    row.approved_listing &&
    typeof row.approved_listing === "object" &&
    !Array.isArray(row.approved_listing)
  ) {
    const listing = row.approved_listing as unknown as TourListing;
    if (listing.slug && listing.title) {
      return { ...listing, productType: row.product_type === "excursion" ? "excursion" : "tour" };
    }
  }
  const tour = rowToPublicTour(row);
  return tour ? tourToListing(tour) : null;
}

export function rowToTourDetail(row: TourRow) {
  const tour = rowToTour(row);
  return tour ? tourToDetail(tour) : null;
}

export function rowToPublicTourDetail(row: TourRow) {
  const tour = rowToPublicTour(row);
  return tour ? tourToDetail(tour) : null;
}

export function rowToAdminSummary(row: TourRow): TourContentAdminSummary {
  const moderationStatus = (row.moderation_status ?? "none") as TourContentAdminSummary["moderationStatus"];
  return {
    id: row.id,
    marketCode: row.market_code,
    rowVersion: row.row_version,
    slug: row.slug,
    ownerUserId: row.owner_user_id,
    status: parseContentStatus(row.status),
    title: row.title,
    productType: row.product_type === "excursion" ? "excursion" : "tour",
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    moderationStatus,
    moderationNotes: row.moderation_notes ?? null,
  };
}

export function tourToContentRow(
  tour: Tour,
  ownerUserId: string
): Omit<TourRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
} {
  const status = tourStatusToContentStatus(tour.status);
  const listing = tourToListing(tour);
  const now = new Date().toISOString();

  return {
    id: tour.id,
    market_code: PRIMARY_PUBLIC_MARKET.id,
    slug: tour.slug,
    owner_user_id: ownerUserId,
    status,
    title: tour.title,
    listing: listing as unknown as Json,
    payload: tour as unknown as Json,
    product_type: tour.type,
    editor_draft: null,
    approved_listing: null,
    approved_payload: null,
    approved_at: null,
    published_at: status === "published" ? now : null,
    moderation_status: "none",
    moderation_notes: null,
    moderated_by: null,
    moderated_at: null,
    row_version: 1,
    created_at: tour.updatedAt ?? now,
    updated_at: tour.updatedAt ?? now,
  };
}
