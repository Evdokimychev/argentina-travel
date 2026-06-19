import {
  REVIEWS_STORE_KEY,
  REVIEWS_UPDATED_EVENT,
  type TouristReview,
  type TouristReviewStatus,
} from "@/types/tourist";
import { shouldSeedDemoData } from "@/lib/demo-mode";
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

function seedDemoReviewsIfEmpty(): TouristReview[] {
  const existing = readAllReviews();
  if (existing.length > 0) return existing;

  if (!shouldSeedDemoData()) {
    return [];
  }

  const now = new Date().toISOString();
  const seeded: TouristReview[] = [
    {
      id: "review-demo-published",
      userId: "ivan-evdokimychev",
      tourId: "2",
      tourSlug: "mendoza-wine",
      tourTitle: "Мендоса: винные маршруты, Аконкагуа и гастрономические ужины",
      bookingId: "booking-demo-completed",
      rating: 5,
      text:
        "Отличная организация, насыщенная программа и внимательный гид. Винные дегустации и вид на Аконкагуа — лучшие впечатления поездки.",
      photos: [],
      tripDate: "2025-11-05",
      status: "published",
      createdAt: "2025-11-08T12:00:00.000Z",
      updatedAt: now,
    },
    {
      id: "review-demo-draft",
      userId: "ivan-evdokimychev",
      tourId: "4",
      tourSlug: "iguazu-falls",
      tourTitle: "Водопады Игуасу за 1 день: аргентинская и бразильская стороны",
      rating: 4,
      text: "Черновик отзыва — допишу после поездки.",
      photos: [],
      status: "draft",
      createdAt: now,
      updatedAt: now,
    },
  ];

  writeAllReviews(seeded);
  return seeded;
}

export function getAllReviews(): TouristReview[] {
  if (typeof window === "undefined") return [];
  return seedDemoReviewsIfEmpty();
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

  const updated: TouristReview = {
    ...all[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  all[index] = updated;
  writeAllReviews(all);
  notifyUpdated();
  return { review: updated };
}

export function getUserReviewsCount(userId: string): number {
  return getUserReviews(userId).length;
}
