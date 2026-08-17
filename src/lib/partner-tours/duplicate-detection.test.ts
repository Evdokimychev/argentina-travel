import { describe, expect, it } from "vitest";
import { detectProbableDuplicates } from "@/lib/partner-tours/duplicate-detection";

describe("detectProbableDuplicates", () => {
  it("flags same partner external id twice", () => {
    const groups = detectProbableDuplicates([
      {
        id: "a",
        partnerSource: "youtravel",
        partnerExternalId: 100,
        title: "Патагония",
      },
      {
        id: "b",
        partnerSource: "youtravel",
        partnerExternalId: 100,
        title: "Патагония копия",
      },
    ]);
    expect(groups.some((g) => g.reason === "same_partner_id")).toBe(true);
  });

  it("flags cross-partner similar title/route", () => {
    const groups = detectProbableDuplicates([
      {
        id: "yt",
        partnerSource: "youtravel",
        partnerExternalId: 1,
        title: "Треккинг к Перито-Морено",
        destination: "Эль-Калафате",
        country: "Аргентина",
        durationDays: 5,
      },
      {
        id: "ts",
        partnerSource: "tripster",
        partnerExternalId: 2,
        title: "Треккинг к Перито-Морено",
        destination: "Эль-Калафате",
        country: "Аргентина",
        durationDays: 5,
      },
    ]);
    expect(groups.some((g) => g.reason === "similar_title_route")).toBe(true);
  });
});
