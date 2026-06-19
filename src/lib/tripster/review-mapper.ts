import type { TripsterReview } from "@/lib/tripster/types";
import type { ExcursionReview } from "@/types/excursion";

export type TripsterReviewRow = {
  id: number;
  rating: number | null;
  author_name: string | null;
  review_text: string | null;
  created_at: string | null;
  payload?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function pickImageUrl(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  const record = asRecord(value);
  if (!record) return undefined;
  for (const key of ["medium", "thumbnail", "original", "url", "image"]) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return undefined;
}

function extractReviewPhotos(payload: TripsterReview & Record<string, unknown>): string[] {
  const buckets = [
    payload.photos,
    payload.traveler_photos,
    payload.images,
    payload.photo,
  ];

  const urls: string[] = [];
  for (const bucket of buckets) {
    if (!Array.isArray(bucket)) continue;
    for (const item of bucket) {
      const url = pickImageUrl(item);
      if (url && !urls.includes(url)) urls.push(url);
    }
  }

  return urls.slice(0, 6);
}

function extractAuthorAvatar(payload: TripsterReview & Record<string, unknown>): string | undefined {
  const author = asRecord(payload.author);
  if (!author) return undefined;

  for (const key of ["avatar", "avatar_url", "photo", "image"]) {
    const url = pickImageUrl(author[key]);
    if (url) return url;
  }

  return undefined;
}

export function tripsterReviewToRow(review: TripsterReview, fallbackId = 0): TripsterReviewRow {
  return {
    id: review.id ?? fallbackId,
    rating: review.rating ?? null,
    author_name: review.name?.trim() || review.author?.name?.trim() || null,
    review_text: review.text?.trim() || null,
    created_at: review.created_at ?? null,
    payload: review,
  };
}

export function mapTripsterReviewRow(row: TripsterReviewRow): ExcursionReview {
  const payload = (row.payload ?? {}) as TripsterReview & Record<string, unknown>;
  const authorName =
    row.author_name?.trim() ||
    payload.name?.trim() ||
    payload.author?.name?.trim() ||
    undefined;

  const createdAt = row.created_at ?? payload.created_at ?? undefined;
  const tripDate =
    (typeof payload.event_date === "string" && payload.event_date) ||
    (typeof payload.trip_date === "string" && payload.trip_date) ||
    (typeof payload.experience_date === "string" && payload.experience_date) ||
    undefined;

  return {
    id: row.id,
    rating: row.rating != null ? Number(row.rating) : payload.rating,
    authorName,
    authorAvatar: extractAuthorAvatar(payload),
    text: row.review_text?.trim() || payload.text?.trim() || undefined,
    createdAt,
    tripDate,
    photos: extractReviewPhotos(payload),
  };
}
