import {
  REVIEWS_STORE_KEY,
  REVIEWS_UPDATED_EVENT,
  type TouristReview,
  type TouristReviewStatus,
} from "@/types/tourist";
import { getDemoReviewSeeds } from "@/lib/reviews-demo-seeds-active";
import { assertPermission, canLeaveReview } from "@/lib/permissions";
import type { SessionUser } from "@/types/user";

function createReviewId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `review-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `review-${Date.now().toString(36)}`;
}

function readAllReviews(): TouristReview[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(REVIEWS_STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TouristReview[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAllReviews(reviews: TouristReview[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REVIEWS_STORE_KEY, JSON.stringify(reviews));
}

function notifyUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(REVIEWS_UPDATED_EVENT));
  }
}

function seedReviewsIfEmpty(): TouristReview[] {
  const existing = readAllReviews();
  if (existing.length > 0) return existing;

  const now = new Date().toISOString();
  const seeded = getDemoReviewSeeds(now);

  writeAllReviews(seeded);
  return seeded;
}

export function getAllReviews(): TouristReview[] {
  if (typeof window === "undefined") return [];
  return seedReviewsIfEmpty();
}

export function getUserReviews(userId: string): TouristReview[] {
  return getAllReviews()
    .filter((review) => review.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function createReview(input: {
  actor: SessionUser | null;
  userId: string;
  tourId: string;
  tourSlug: string;
  tourTitle: string;
  bookingId?: string;
  rating: number;
  text: string;
  photos?: string[];
  tripDate?: string;
  status?: TouristReviewStatus;
}): TouristReview | { error: string } {
  const allowed = assertPermission(canLeaveReview(input.actor));
  if ("error" in allowed) return allowed;
  if (!input.actor || input.actor.id !== input.userId) {
    return { error: "Нет доступа" };
  }

  const now = new Date().toISOString();
  const review: TouristReview = {
    id: createReviewId(),
    userId: input.userId,
    tourId: input.tourId,
    tourSlug: input.tourSlug,
    tourTitle: input.tourTitle,
    bookingId: input.bookingId,
    rating: Math.min(5, Math.max(1, input.rating)),
    text: input.text.trim(),
    photos: input.photos ?? [],
    tripDate: input.tripDate,
    status: input.status ?? "draft",
    createdAt: now,
    updatedAt: now,
  };

  const all = getAllReviews();
  writeAllReviews([review, ...all]);
  notifyUpdated();
  return review;
}

export function updateReviewStatus(
  reviewId: string,
  status: TouristReviewStatus,
  actor: SessionUser | null
): { review: TouristReview } | { error: string } {
  const all = getAllReviews();
  const index = all.findIndex((review) => review.id === reviewId);
  if (index === -1) return { error: "Отзыв не найден" };

  const allowed = assertPermission(canLeaveReview(actor));
  if ("error" in allowed) return allowed;
  if (!actor || all[index].userId !== actor.id) {
    return { error: "Нет доступа" };
  }

  const current = all[index];
  if (status === "published") {
    status = "pending";
  }
  if (!["draft", "pending", "rejected"].includes(status)) {
    return { error: "Недопустимый статус" };
  }
  if (current.status === "published") {
    return { error: "Опубликованный отзыв нельзя изменить" };
  }

  const updated: TouristReview = {
    ...current,
    status,
    updatedAt: new Date().toISOString(),
  };
  all[index] = updated;
  writeAllReviews(all);
  notifyUpdated();
  return { review: updated };
}

export async function submitReviewForModeration(
  reviewId: string,
  actor: SessionUser | null
): Promise<{ review: TouristReview } | { error: string }> {
  const all = getAllReviews();
  const existing = all.find((review) => review.id === reviewId);
  if (!existing) return { error: "Отзыв не найден" };

  const localResult = updateReviewStatus(reviewId, "pending", actor);
  if ("error" in localResult) return localResult;

  if (typeof window !== "undefined") {
    try {
      const { isSupabaseReviewsEnabled } = await import("@/lib/auth-mode");
      if (isSupabaseReviewsEnabled()) {
        await syncReviewToServer({ ...localResult.review, status: "pending" });
        const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "submit" }),
        });
        if (res.ok) {
          const json = (await res.json()) as { review?: TouristReview };
          if (json.review) return { review: json.review };
        }
      }
    } catch {
      // localStorage fallback already applied
    }
  }

  return localResult;
}

export async function syncReviewToServer(
  review: TouristReview,
  organizerTourId?: string
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review, organizerTourId }),
    });
  } catch {
    // non-blocking
  }
}

export function getUserReviewsCount(userId: string): number {
  return getUserReviews(userId).length;
}
