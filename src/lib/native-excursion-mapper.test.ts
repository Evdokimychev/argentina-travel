import { describe, expect, it } from "vitest";
import type { TourDetail, TourListing } from "@/types";
import type { Tour } from "@/types/tour";
import {
  nativeExcursionCities,
  nativeTourDetailToExcursion,
  nativeTourListingToExcursion,
} from "@/lib/native-excursion-mapper";

function listing(overrides: Partial<TourListing> = {}): TourListing {
  return {
    id: "org-excursion-1",
    slug: "progulka-po-buenos-ayresu",
    title: "Прогулка по Буэнос-Айресу",
    productType: "excursion",
    shortDescription: "Городская прогулка с местным гидом",
    image: "/images/excursion.jpg",
    gallery: [],
    destination: "Буэнос-Айрес",
    region: "Буэнос-Айрес",
    activityType: "Экскурсионные туры",
    durationDays: 1,
    durationNights: 0,
    durationBucket: "1-3 дня",
    priceUsd: 75,
    bookingMode: "on_request",
    accommodationType: "Без проживания",
    comfortLevel: "Без проживания",
    difficultyLevel: "Лёгкая",
    language: ["Русский"],
    childrenAllowed: "Без ограничений",
    minimumAge: 0,
    groupSizeMin: 1,
    groupSizeMax: 8,
    groupSizeBucket: "До 8 человек",
    availableDates: [],
    latitude: -34.6,
    longitude: -58.4,
    rating: 0,
    reviewCount: 0,
    organizer: { name: "Пора в Аргентину", avatar: "" },
    badges: [],
    ...overrides,
  } as TourListing;
}

describe("native excursion mapper", () => {
  it("maps an organizer excursion into the public excursion catalog", () => {
    const excursion = nativeTourListingToExcursion(listing());

    expect(excursion.partner).toBe("platform");
    expect(excursion.slug).toBe("progulka-po-buenos-ayresu");
    expect(excursion.citySlug).toBe("buenos-ayres");
    expect(excursion.priceValue).toBe(75);
    expect(excursion.formatKind).toBe("individual");
    expect(excursion.rating).toBeUndefined();
  });

  it("groups native excursions into stable city filters", () => {
    const items = [
      nativeTourListingToExcursion(listing()),
      nativeTourListingToExcursion(
        listing({ id: "org-excursion-2", slug: "tango", title: "История танго" })
      ),
    ];

    expect(nativeExcursionCities(items)).toEqual([
      expect.objectContaining({ slug: "buenos-ayres", experienceCount: 2 }),
    ]);
  });

  it("maps an approved native detail into a bookable first-party excursion", () => {
    const canonical = {
      geography: {
        destination: "Буэнос-Айрес",
        coordinates: { lat: -34.6, lng: -58.4 },
      },
      classification: { primaryActivity: "Экскурсионные туры" },
      participants: { languages: ["Русский"] },
      levels: { difficultyDescription: "Спокойная прогулка" },
    } as Tour;
    const detail = {
      id: "org-excursion-1",
      slug: "progulka-po-buenos-ayresu",
      title: "Прогулка по Буэнос-Айресу",
      shortDescription: "Городская прогулка с местным гидом",
      image: "/images/excursion.jpg",
      gallery: ["/images/excursion-2.jpg"],
      region: "Буэнос-Айрес",
      durationDays: 1,
      durationNights: 0,
      priceUsd: 75,
      rating: 0,
      reviewCount: 0,
      difficulty: "Лёгкая",
      comfort: "Без проживания",
      accommodationType: "Без проживания",
      groupMin: 1,
      groupMax: 8,
      minimumAge: 0,
      bookingMode: "on_request",
      requestDateFrom: "2026-07-15",
      requestDateTo: "2026-12-31",
      places: [],
      descriptionBlocks: [{ type: "paragraph", content: "История города" }],
      itinerary: [],
      organizer: {
        id: "owner-1",
        name: "Иван",
        role: "Организатор",
        avatar: "",
        rating: 0,
        tourCount: 1,
        travelerCount: 0,
        languages: ["Русский"],
        experienceYears: 1,
        phone: "",
        email: "",
      },
      reviews: [],
      included: ["Работа гида"],
      excluded: [],
      arrival: {
        airports: [],
        flights: [],
        transfers: [],
        meetingPoint: "Площадь Мая",
        startTime: "09:30",
      },
      importantInfo: [],
      faq: [],
      dates: [],
      tags: ["Архитектура"],
    } as unknown as TourDetail;

    const excursion = nativeTourDetailToExcursion(canonical, detail);

    expect(excursion).toMatchObject({
      partner: "platform",
      platformTourId: "org-excursion-1",
      platformBookingMode: "on_request",
      platformStartTime: "09:30",
      isBookable: true,
      meetingPoint: { text: "Площадь Мая" },
    });
    expect(excursion.descriptionBlocks[0]?.html).toContain("История города");
  });
});
