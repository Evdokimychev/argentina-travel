import { describe, expect, it } from "vitest";
import { orderTourSectionLinksByLayout } from "@/components/tour-detail/tour-section-links";

describe("orderTourSectionLinksByLayout", () => {
  const links = [
    { id: "description", label: "Описание" },
    { id: "itinerary", label: "Программа" },
    { id: "faq", label: "Вопросы" },
    { id: "reviews", label: "Отзывы" },
  ];

  it("keeps original order when override is empty", () => {
    expect(orderTourSectionLinksByLayout(links)).toEqual(links);
    expect(orderTourSectionLinksByLayout(links, [])).toEqual(links);
  });

  it("reorders known nav ids and appends the rest", () => {
    const ordered = orderTourSectionLinksByLayout(links, ["faq", "reviews", "itinerary"]);
    expect(ordered.map((link) => link.id)).toEqual([
      "faq",
      "reviews",
      "itinerary",
      "description",
    ]);
  });
});
