import { describe, expect, it } from "vitest";
import {
  extractYouTravelReviewsFromPayload,
  mapYouTravelReviewsToTourReviews,
  normalizeYouTravelReviewEntry,
  normalizeYouTravelReviewPlainText,
  stripTrailingReviewAuthorSignature,
} from "@/lib/youtravel/review-mapper";
import { extractPublicTourReviews } from "@/lib/youtravel/public-description";

describe("YouTravel review mapper", () => {
  it("converts inline br tags in review text to plain paragraphs", () => {
    const reviews = mapYouTravelReviewsToTourReviews([
      {
        id: 200,
        name: "FARIT NIZAMOV",
        rating: 5,
        text: "Первая строка<br>Вторая строка!<br><br>Фарит Низамов",
      },
    ]);

    expect(reviews[0]?.text).toBe("Первая строка\nВторая строка!");
    expect(normalizeYouTravelReviewPlainText("Текст<br />продолжение")).toBe(
      "Текст\nпродолжение",
    );
    expect(
      stripTrailingReviewAuthorSignature("Отличный тур!\n\nФарит Низамов", "FARIT NIZAMOV"),
    ).toBe("Отличный тур!");
  });

  it("maps API review objects to TourReview", () => {
    const reviews = mapYouTravelReviewsToTourReviews([
      {
        id: 101,
        name: "Кузя",
        rating: 5,
        created_at: "2026-03-01",
        text: "Если вы не любите пассивный отдых, этот тур для вас.",
        photos: ["https://cf.youtravel.me/upload/review/sample.jpg"],
      },
    ]);

    expect(reviews).toHaveLength(1);
    expect(reviews[0]?.author).toBe("Кузя");
    expect(reviews[0]?.rating).toBe(5);
    expect(reviews[0]?.source).toBe("youtravel");
    expect(reviews[0]?.photos[0]).toContain("cf.youtravel.me");
  });

  it("extracts reviews from payload buckets", () => {
    const payload = {
      reviews: [{ id: 1, name: "Вера", rating: 5, text: "Отличный тур" }],
    };

    expect(extractYouTravelReviewsFromPayload(payload)).toHaveLength(1);
  });

  it("normalizes flexible review shapes", () => {
    const review = normalizeYouTravelReviewEntry(
      {
        author_name: "Екатерина",
        rate: "5",
        reviewText: "Всё чётко организовано",
        publishedAt: "2026-02-08",
      },
      1,
    );

    expect(review?.name).toBe("Екатерина");
    expect(review?.rating).toBe(5);
    expect(review?.text).toContain("организовано");
  });

  it("maps public API review objects with review_photos", () => {
    const reviews = mapYouTravelReviewsToTourReviews([
      {
        id: 30982,
        date: "07.07.2025 00:21:33",
        name: "Елена",
        only_name: "Елена",
        rating: 5,
        message: "Страна радует и необычных гор.",
        display_date: "Июль, 2025",
        photos: [
          {
            AllocationSrc: "/upload/review_photos/4c7/sample.jpg",
            AllocationPreviewSrc:
              "https://cf.youtravel.me/tr:w-400%2Ch-400/upload/review_photos/4c7/sample.jpg",
          },
        ],
      },
    ]);

    expect(reviews).toHaveLength(1);
    expect(reviews[0]?.author).toBe("Елена");
    expect(reviews[0]?.text).toContain("радует");
    expect(reviews[0]?.photos[0]).toContain("upload/review_photos/4c7/sample.jpg");
  });

  it("normalizes nested public reviews API envelope", async () => {
    const { unwrapYouTravelList } = await import("@/lib/youtravel/response");
    const body = {
      success: true,
      data: {
        reviews: [{ id: 1, name: "Вера", rating: 5, message: "Отличный тур" }],
      },
    };

    const list = unwrapYouTravelList(body);
    const reviews = mapYouTravelReviewsToTourReviews(
      list
        .map((entry, index) => normalizeYouTravelReviewEntry(entry, index + 1))
        .filter((entry): entry is NonNullable<typeof entry> => entry != null),
    );

    expect(reviews).toHaveLength(1);
    expect(reviews[0]?.author).toBe("Вера");
  });

  it("extracts reviews from public HTML blocks", () => {
    const html = `
      <div class="tour-reviews-item">
        <span class="tour-reviews-item__name">Кузя</span>
        <span class="tour-reviews-item__rating">5.0</span>
        <span class="tour-reviews-item__date">1 марта 2026</span>
        <div class="tour-reviews-item__text">Если вы не любите пассивный отдых...</div>
      </div>
    `;

    const reviews = extractPublicTourReviews(html);
    expect(reviews).toHaveLength(1);
    expect(reviews[0]?.name).toBe("Кузя");
    expect(reviews[0]?.text).toContain("пассивный отдых");
  });
});
