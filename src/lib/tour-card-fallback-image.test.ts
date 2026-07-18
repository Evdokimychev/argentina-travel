import { describe, expect, it } from "vitest";
import { resolveTourCardFallbackImage } from "@/lib/tour-card-fallback-image";

function tour(title: string, destination = "", region = "") {
  return { title, destination, region, activityType: "Экскурсионные туры", partnerThematicTags: [] };
}

describe("resolveTourCardFallbackImage", () => {
  it.each([
    ["Водопады Игуасу", "/media/tours/iguazu-falls/hero.jpg"],
    ["Винная неделя в Мендосе", "/media/tours/mendoza-wine/hero.jpg"],
    ["Ушуайя и край света", "/media/tours/ushuaia-end-of-world/hero.jpg"],
    ["Треккинг к Фитц-Рою", "/media/tours/fitz-roy-trek/hero.jpg"],
  ])("selects a thematic local image for %s", (title, expected) => {
    expect(resolveTourCardFallbackImage(tour(title))).toBe(expected);
  });

  it("uses the general Argentina image when the theme is unknown", () => {
    expect(resolveTourCardFallbackImage(tour("Большое путешествие"))).toBe("/media/home/hero.jpg");
  });
});
