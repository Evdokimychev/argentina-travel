import { htmlToPlainText } from "@/lib/rich-text";
import { resolveYouTravelMediaUrl } from "@/lib/youtravel/partner-tour-content";
import type { YouTravelReview, YouTravelTour } from "@/lib/youtravel/types";
import type { TourReview } from "@/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function pickNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function resolveYouTravelReviewPhotoUrl(value: unknown): string | null {
  if (typeof value === "string") {
    return resolveYouTravelMediaUrl(value);
  }

  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  for (const key of [
    "AllocationPreviewSrc",
    "AllocationSrc",
    "AllocationThumbSrc",
    "previewSrc",
    "src",
    "url",
    "medium",
    "thumbnail",
  ]) {
    const resolved = resolveYouTravelMediaUrl(record[key]);
    if (resolved) return resolved;
  }

  return resolveYouTravelMediaUrl(value);
}

function extractReviewPhotos(review: YouTravelReview & Record<string, unknown>): string[] {
  const buckets = [review.photos, review.images, review.photo, review.gallery];
  const urls: string[] = [];

  for (const bucket of buckets) {
    if (!Array.isArray(bucket)) continue;
    for (const item of bucket) {
      const url = resolveYouTravelReviewPhotoUrl(item);
      if (url && !urls.includes(url)) urls.push(url);
    }
  }

  return urls.slice(0, 6);
}

function extractReviewAvatar(review: YouTravelReview & Record<string, unknown>): string {
  const user = asRecord(review.user) ?? asRecord(review.author) ?? asRecord(review.traveler);
  return (
    resolveYouTravelMediaUrl(review.avatar) ??
    resolveYouTravelMediaUrl(review.photo) ??
    resolveYouTravelMediaUrl(user?.avatar) ??
    resolveYouTravelMediaUrl(user?.photo) ??
    ""
  );
}

function normalizeReviewDate(value?: string | null): string {
  if (!value?.trim()) return "";
  const trimmed = value.trim();
  const dotted = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotted) return `${dotted[3]}-${dotted[2].padStart(2, "0")}-${dotted[1].padStart(2, "0")}`;
  return trimmed;
}

/** YouTravel often stores `<br>` inside plain `text` / `message` fields. */
export function normalizeYouTravelReviewPlainText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  if (/<[a-z][^>]*>/i.test(trimmed)) {
    return htmlToPlainText(trimmed).replace(/\u00a0/g, " ");
  }

  return trimmed
    .replace(/\r\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function collapseAuthorName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function looksLikeBareNameLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 80) return false;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 5) return false;
  if (/[.!?,:;]/.test(trimmed)) return false;
  return /^[\p{L}\s'-]+$/u.test(trimmed);
}

/** Drop trailing signature line when it repeats the review author name. */
export function stripTrailingReviewAuthorSignature(text: string, author: string): string {
  const authorKey = collapseAuthorName(author);
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  while (lines.length > 1) {
    const lastLine = lines[lines.length - 1]?.trim() ?? "";
    if (!lastLine) {
      lines.pop();
      continue;
    }

    const lastKey = collapseAuthorName(lastLine);
    if (authorKey && lastKey === authorKey) {
      lines.pop();
      continue;
    }

    const previousContentLine = [...lines.slice(0, -1)]
      .reverse()
      .find((line) => line.trim())?.trim();
    if (
      previousContentLine &&
      /[!?.]$/.test(previousContentLine) &&
      looksLikeBareNameLine(lastLine)
    ) {
      lines.pop();
      while (lines.length && !lines[lines.length - 1]?.trim()) lines.pop();
      continue;
    }

    break;
  }

  return lines.join("\n").trim();
}

export function normalizeYouTravelReviewEntry(
  entry: unknown,
  fallbackId: number,
): YouTravelReview | null {
  if (!entry || typeof entry !== "object") return null;
  const review = entry as YouTravelReview & Record<string, unknown>;
  const user = asRecord(review.user) ?? asRecord(review.author) ?? asRecord(review.traveler);

  const text = pickString(
    review.text,
    review.review_text,
    review.reviewText,
    review.content,
    review.comment,
    review.message,
  );
  const htmlText = pickString(review.html, review.description);
  const plainText =
    normalizeYouTravelReviewPlainText(text) ??
    normalizeYouTravelReviewPlainText(htmlText);
  const rating = pickNumber(review.rating, review.rate, review.score, review.stars);
  const author = pickString(
    review.name,
    review.author_name,
    review.authorName,
    review.only_name,
    user?.name,
    user?.fullName,
    user?.username,
  );

  if (!plainText && rating == null) return null;

  const idRaw = review.id ?? review.review_id ?? fallbackId;

  return {
    id: typeof idRaw === "number" || typeof idRaw === "string" ? idRaw : fallbackId,
    rating,
    name: author,
    text: plainText,
    created_at: pickString(
      review.created_at,
      review.createdAt,
      review.date,
      review.display_date,
      review.published_at,
      review.publishedAt,
    ),
    trip_date: pickString(review.trip_date, review.tripDate, review.event_date, review.eventDate),
      avatar: extractReviewAvatar(review) || undefined,
      photos: extractReviewPhotos(review),
    reply: normalizeYouTravelReviewPlainText(
      pickString(review.reply, review.organizer_reply, review.expert_reply),
    ),
    reply_at: pickString(review.reply_at, review.replyAt, review.organizer_replied_at),
  };
}

export function extractYouTravelReviewsFromPayload(payload: YouTravelTour): YouTravelReview[] {
  const buckets = [
    payload.reviews,
    payload.reviews_list,
    payload.tour_reviews,
    payload.public_page_extras?.reviews,
    payload.cached_reviews,
  ];

  const reviews: YouTravelReview[] = [];

  for (const bucket of buckets) {
    if (!Array.isArray(bucket)) continue;
    bucket.forEach((entry, index) => {
      const normalized = normalizeYouTravelReviewEntry(entry, index + 1);
      if (normalized) reviews.push(normalized);
    });
    if (reviews.length) break;
  }

  return reviews;
}

export function mapYouTravelReviewsToTourReviews(reviews: YouTravelReview[]): TourReview[] {
  return reviews.map((review, index) => {
    const normalized =
      normalizeYouTravelReviewEntry(review, index + 1) ?? (review as YouTravelReview);
    const record = normalized as YouTravelReview & Record<string, unknown>;
    const id = normalized.id != null ? String(normalized.id) : `yt-review-${index + 1}`;
    return {
      id,
      author: normalized.name?.trim() || "Путешественник",
      avatar: extractReviewAvatar(record),
      rating:
        normalized.rating != null && Number.isFinite(normalized.rating) ? normalized.rating : 5,
      date: normalizeReviewDate(normalized.created_at),
      tripDate: normalizeReviewDate(normalized.trip_date),
      text: stripTrailingReviewAuthorSignature(
        normalized.text?.trim() || "",
        normalized.name?.trim() || "Путешественник",
      ),
      photos: extractReviewPhotos(record),
      verifiedTrip: true,
      source: "youtravel",
      organizerReply: normalized.reply?.trim() || undefined,
      organizerRepliedAt: normalizeReviewDate(normalized.reply_at) || undefined,
    };
  });
}

export function syncYouTravelTourReviewCount(
  tour: { reviewCount: number },
  reviews: TourReview[],
): number {
  return Math.max(tour.reviewCount, reviews.length);
}
