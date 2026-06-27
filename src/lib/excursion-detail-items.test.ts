import { describe, expect, it } from "vitest";
import {
  buildExcursionDetailItems,
  formatExcursionFormatDetailValue,
  normalizeExcursionMovementType,
} from "@/lib/excursion-detail-items";
import type { ExcursionDetail } from "@/types/excursion";

const t = (key: string) => {
  const map: Record<string, string> = {
    "excursions.detail.movement": "Передвижение",
    "excursions.detail.duration": "Длительность",
    "excursions.detail.format": "Формат",
    "excursions.format.individualDetail": "Индивидуальный формат. Для {min}–{max} человек",
    "excursions.format.group": "Групповая",
    "excursions.detail.additionalServices": "Дополнительные услуги",
    "excursions.additionalServices.teaser": "Есть дополнительные услуги. Подробнее",
    "excursions.detail.languages": "Язык",
    "excursions.meta.childFriendly": "Подходит для детей",
    "excursions.detail.children": "Дети",
  };
  return map[key] ?? key;
};

const baseExcursion: ExcursionDetail = {
  partner: "tripster",
  id: 1,
  slug: "test-t1",
  title: "Test",
  cityId: 1,
  citySlug: "ba",
  cityName: "Буэнос-Айрес",
  reviewCount: 0,
  photos: [],
  tripsterUrl: "https://example.com",
  partnerUrl: "https://example.com",
  bookingHref: "/api/affiliate/go/test-t1",
  descriptionBlocks: [],
  ticketOptions: [],
  tags: [],
};

describe("normalizeExcursionMovementType", () => {
  it("maps walk to foot", () => {
    expect(normalizeExcursionMovementType("walk")).toBe("foot");
  });
});

describe("formatExcursionFormatDetailValue", () => {
  it("formats individual with person range", () => {
    expect(formatExcursionFormatDetailValue("individual", 10, t)).toBe(
      "Индивидуальный формат. Для 1–10 человек",
    );
  });
});

describe("buildExcursionDetailItems", () => {
  it("includes movement, duration, format and additional services link", () => {
    const items = buildExcursionDetailItems(
      {
        ...baseExcursion,
        movementType: "walk",
        durationMinutes: 180,
        formatKind: "individual",
        maxPersons: 10,
        languages: ["Русский"],
        childFriendly: true,
        ticketOptions: [
          { id: 1, title: "Взрослый", isDefault: true },
          { id: 2, title: "Фотосессия", value: 50 },
        ],
      },
      t,
    );

    expect(items.map((item) => item.id)).toEqual([
      "movement",
      "duration",
      "children",
      "languages",
      "format",
      "additional-services",
    ]);
    expect(items.find((item) => item.id === "format")?.value).toBe(
      "Индивидуальный формат. Для 1–10 человек",
    );
    expect(items.find((item) => item.id === "additional-services")).toMatchObject({
      linkHref: "#additional-services",
      value: "Есть дополнительные услуги. Подробнее",
    });
  });
});
