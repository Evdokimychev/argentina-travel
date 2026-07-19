import type { TouristReview } from "@/types/tourist";

/** Isolated local-demo provider, selected by the build alias only. */
export function getDemoReviewSeeds(now: string): TouristReview[] {
  return [
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
}
