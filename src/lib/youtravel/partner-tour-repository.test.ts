import { describe, expect, it } from "vitest";
import { rowToListing, type YouTravelTourRow } from "@/lib/youtravel/partner-tour-repository";

function stubRow(overrides: Partial<YouTravelTourRow> = {}): YouTravelTourRow {
  return {
    id: 52537,
    slug: "patagonia-yt52537",
    title: "Треккинг в Патагонии",
    country: "Аргентина",
    region: "Патагония",
    city: "Эль-Чалтен",
    status: "published",
    duration_days: 7,
    duration_nights: 6,
    rating: 4.8,
    review_count: 12,
    price_value: 1200,
    price_currency: "USD",
    price_display: "от $1 200",
    youtravel_url: "https://youtravel.me/tours/patagonia-yt52537",
    partner_url: null,
    cover_image: null,
    photos: [],
    payload: {},
    ...overrides,
  };
}

describe("rowToListing", () => {
  it("maps comfort, difficulty, children and minimum age from payload", () => {
    const listing = rowToListing(
      stubRow({
        payload: {
          comfort_data: { level: 5 },
          activity_data: { level: 4 },
          age_from: 12,
        },
      })
    );

    expect(listing.comfortLevel).toBe("Премиум");
    expect(listing.difficultyLevel).toBe("Высокая");
    expect(listing.minimumAge).toBe(12);
    expect(listing.childrenAllowed).toBe("От 12 лет");
  });

  it("uses sensible defaults when payload lacks metadata", () => {
    const listing = rowToListing(stubRow());

    expect(listing.comfortLevel).toBe("Стандарт");
    expect(listing.difficultyLevel).toBe("Умеренная");
    expect(listing.minimumAge).toBe(0);
    expect(listing.childrenAllowed).toBe("Без ограничений");
  });

  it("maps adults-only tours", () => {
    const listing = rowToListing(
      stubRow({
        payload: { age_from: 18 },
      })
    );

    expect(listing.minimumAge).toBe(18);
    expect(listing.childrenAllowed).toBe("Только взрослые");
  });

  it("sets organizerOwnerId for expert catalog filter", () => {
    const listing = rowToListing(
      stubRow({
        payload: {
          expert: { id: 51497, name: "Мария", slug: "maria" },
        },
      })
    );

    expect(listing.organizerOwnerId).toBe("youtravel-expert-51497");
  });
});
