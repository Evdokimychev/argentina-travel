import type { Json, TourRow } from "@/types/database";
import type { TourListing } from "@/types";
import type { Tour, TourStatus } from "@/types/tour";
import type { TourContentAdminSummary, TourContentStatus } from "@/types/tour-content";
import { tourToDetail, tourToListing } from "@/lib/tour-mapper";

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

export function rowToTourListing(row: TourRow): TourListing | null {
  if (row.listing && typeof row.listing === "object" && !Array.isArray(row.listing)) {
    const listing = row.listing as unknown as TourListing;
    if (listing.slug && listing.title) return listing;
  }

  const tour = rowToTour(row);
  return tour ? tourToListing(tour) : null;
}

export function rowToTourDetail(row: TourRow) {
  const tour = rowToTour(row);
  return tour ? tourToDetail(tour) : null;
}

export function rowToAdminSummary(row: TourRow): TourContentAdminSummary {
  const moderationStatus = (row.moderation_status ?? "none") as TourContentAdminSummary["moderationStatus"];
  return {
    id: row.id,
    slug: row.slug,
    ownerUserId: row.owner_user_id,
    status: parseContentStatus(row.status),
    title: row.title,
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
    slug: tour.slug,
    owner_user_id: ownerUserId,
    status,
    title: tour.title,
    listing: listing as unknown as Json,
    payload: tour as unknown as Json,
    published_at: status === "published" ? now : null,
    moderation_status: "none",
    moderation_notes: null,
    moderated_by: null,
    moderated_at: null,
    created_at: tour.updatedAt ?? now,
    updated_at: tour.updatedAt ?? now,
  };
}
