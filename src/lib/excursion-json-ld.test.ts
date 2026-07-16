import { describe, expect, it } from "vitest";
import { buildExcursionJsonLd } from "@/lib/excursion-json-ld";
import type { ExcursionDetail } from "@/types/excursion";

describe("excursion JSON-LD", () => {
  it("does not emit an Event without a concrete dated slot", () => {
    const excursion = {
      partner: "tripster",
      id: 1,
      slug: "test",
      title: "Экскурсия",
      cityId: 1,
      citySlug: "buenos-aires",
      cityName: "Буэнос-Айрес",
      reviewCount: 0,
      photos: [],
      tripsterUrl: "https://experience.tripster.ru/experience/1/",
      partnerUrl: "https://experience.tripster.ru/experience/1/",
      bookingHref: "/api/affiliate/go/test",
      descriptionBlocks: [],
      ticketOptions: [],
      tags: [],
    } satisfies ExcursionDetail;

    const schema = buildExcursionJsonLd(excursion);
    expect(schema["@graph"].map((item) => item["@type"])).toEqual(["TouristTrip"]);
  });
});
