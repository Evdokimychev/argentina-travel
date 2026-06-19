import type { Json } from "@/types/database";
import type { TouristReview, TouristReviewStatus } from "@/types/tourist";

export type TouristReviewRow = {
  id: string;
  user_id: string | null;
  organizer_user_id: string | null;
  organizer_tour_id: string | null;
  organizer_reply: string | null;
  organizer_replied_at: string | null;
  organizer_replied_by: string | null;
  tour_id: string;
  tour_slug: string;
  tour_title: string;
  booking_id: string | null;
  listing_kind: string;
  rating: number;
  review_text: string;
  photos: Json;
  trip_date: string | null;
  status: string;
  moderation_notes: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  created_at: string;
  updated_at: string;
};

function parsePhotos(raw: Json): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string");
}

export function rowToReview(row: TouristReviewRow): TouristReview {
  return {
    id: row.id,
    userId: row.user_id ?? "",
    tourId: row.tour_id,
    tourSlug: row.tour_slug,
    tourTitle: row.tour_title,
    listingKind: row.listing_kind === "excursion" ? "excursion" : "tour",
    bookingId: row.booking_id ?? undefined,
    rating: row.rating,
    text: row.review_text,
    photos: parsePhotos(row.photos),
    tripDate: row.trip_date ?? undefined,
    status: row.status as TouristReviewStatus,
    moderationNotes: row.moderation_notes ?? undefined,
    organizerReply: row.organizer_reply ?? undefined,
    organizerRepliedAt: row.organizer_replied_at ?? undefined,
    organizerRepliedBy: row.organizer_replied_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function reviewToRow(
  review: TouristReview,
  extras?: {
    organizerUserId?: string | null;
    organizerTourId?: string | null;
  }
): Omit<TouristReviewRow, "created_at" | "updated_at" | "moderated_by" | "moderated_at"> & {
  created_at?: string;
  updated_at?: string;
  moderated_by?: string | null;
  moderated_at?: string | null;
} {
  return {
    id: review.id,
    user_id: review.userId || null,
    organizer_user_id: extras?.organizerUserId ?? null,
    organizer_tour_id: extras?.organizerTourId ?? null,
    organizer_reply: review.organizerReply ?? null,
    organizer_replied_at: review.organizerRepliedAt ?? null,
    organizer_replied_by: review.organizerRepliedBy ?? null,
    tour_id: review.tourId,
    tour_slug: review.tourSlug,
    tour_title: review.tourTitle,
    booking_id: review.bookingId ?? null,
    listing_kind: review.listingKind ?? "tour",
    rating: review.rating,
    review_text: review.text,
    photos: review.photos as Json,
    trip_date: review.tripDate ?? null,
    status: review.status,
    moderation_notes: review.moderationNotes ?? null,
    created_at: review.createdAt,
    updated_at: review.updatedAt,
  };
}

export type ModerationReviewSummary = {
  id: string;
  tourTitle: string;
  tourSlug: string;
  rating: number;
  text: string;
  authorUserId: string;
  authorName: string | null;
  organizerUserId: string | null;
  tripDate: string | null;
  status: TouristReviewStatus;
  createdAt: string;
};

export type ModerationReviewReportSummary = {
  id: string;
  reviewId: string;
  reason: string;
  details: string | null;
  reporterUserId: string | null;
  reporterName: string | null;
  reviewTourTitle: string;
  reviewTourSlug: string;
  reviewRating: number;
  reviewText: string;
  createdAt: string;
};

export function rowToModerationReviewSummary(
  row: TouristReviewRow,
  authorName?: string | null
): ModerationReviewSummary {
  return {
    id: row.id,
    tourTitle: row.tour_title,
    tourSlug: row.tour_slug,
    rating: row.rating,
    text: row.review_text,
    authorUserId: row.user_id ?? "",
    authorName: authorName ?? null,
    organizerUserId: row.organizer_user_id,
    tripDate: row.trip_date,
    status: row.status as TouristReviewStatus,
    createdAt: row.created_at,
  };
}
