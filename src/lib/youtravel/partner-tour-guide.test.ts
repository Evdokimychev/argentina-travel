import { describe, expect, it } from "vitest";
import {
  buildYouTravelExpertCatalogHref,
  mapYouTravelExpertToGuideProfile,
  parseYouTravelExpertOrganizerSlug,
  resolveYouTravelExpert,
  resolveYouTravelExpertOrganizerLabel,
  resolveYouTravelExpertRating,
  resolveYouTravelExpertReviewCount,
  resolveYouTravelExpertTourCount,
} from "@/lib/youtravel/partner-tour-guide";
import type { YouTravelTour } from "@/lib/youtravel/types";

const samplePayload = {
  expert: {
    id: 51497,
    link: "/expert/51497/александр",
    name: "Александр",
  },
  expert_data: {
    name: "Александр Н",
    avatar: {
      src: "https://cf.youtravel.me/upload/avatars/sample.jpg",
      host: "cf.youtravel.me",
    },
    tours_count: 4,
    count_reviews: "8",
    rating_expert: "5.0",
    personal_notes:
      "Уже более 5 лет я и моя команда организуем авторские туры.\r\n\r\nМы работаем в Патагонии и Чили.",
    guide_since: "2019",
  },
} satisfies YouTravelTour;

describe("resolveYouTravelExpert", () => {
  it("merges expert and expert_data with expert id and link winning", () => {
    const merged = resolveYouTravelExpert(samplePayload);

    expect(merged).toMatchObject({
      id: 51497,
      link: "/expert/51497/александр",
      name: "Александр Н",
      tours_count: 4,
      count_reviews: "8",
      rating_expert: "5.0",
    });
  });

  it("falls back to organizer when expert blocks are missing", () => {
    const merged = resolveYouTravelExpert({
      organizer: { id: 42, name: "Мария", personal_notes: "Описание" },
    });

    expect(merged).toMatchObject({
      id: 42,
      name: "Мария",
      personal_notes: "Описание",
    });
  });
});

describe("YouTravel expert metrics", () => {
  it("parses string ratings and review counts", () => {
    const merged = resolveYouTravelExpert(samplePayload);

    expect(resolveYouTravelExpertRating(merged)).toBe(5);
    expect(resolveYouTravelExpertReviewCount(merged)).toBe(8);
    expect(resolveYouTravelExpertTourCount(merged)).toBe(4);
  });
});

describe("mapYouTravelExpertToGuideProfile", () => {
  it("maps merged expert to ExcursionGuideProfile", () => {
    const merged = resolveYouTravelExpert(samplePayload);
    const profile = mapYouTravelExpertToGuideProfile(merged!);

    expect(profile).toMatchObject({
      id: 51497,
      name: "Александр Н",
      url: "https://youtravel.me/expert/51497/александр",
      rating: 5,
      reviewCount: 8,
      excursionCount: 4,
      roleLabel: "Тревел-эксперт YouTravel.me",
      guideSince: "2019",
    });
    expect(profile?.avatar).toContain("cf.youtravel.me");
    expect(profile?.descriptionParagraphs).toEqual([
      "Уже более 5 лет я и моя команда организуем авторские туры.",
      "Мы работаем в Патагонии и Чили.",
    ]);
  });

  it("returns null when expert id is missing", () => {
    expect(mapYouTravelExpertToGuideProfile({ name: "Без id" })).toBeNull();
  });
});

describe("buildYouTravelExpertCatalogHref", () => {
  it("builds organizer filter link for catalog", () => {
    expect(buildYouTravelExpertCatalogHref(51497)).toBe(
      "/tours?organizer=youtravel-expert-51497"
    );
  });
});

describe("parseYouTravelExpertOrganizerSlug", () => {
  it("parses youtravel expert organizer slugs", () => {
    expect(parseYouTravelExpertOrganizerSlug("youtravel-expert-51497")).toBe(51497);
    expect(parseYouTravelExpertOrganizerSlug("other-slug")).toBeNull();
  });
});

describe("resolveYouTravelExpertOrganizerLabel", () => {
  it("resolves expert name from tour listings", () => {
    expect(
      resolveYouTravelExpertOrganizerLabel("youtravel-expert-51497", [
        {
          organizerOwnerId: "youtravel-expert-51497",
          organizer: { slug: "youtravel-expert-51497", name: "Александр" },
        },
      ])
    ).toBe("Александр");
  });
});
