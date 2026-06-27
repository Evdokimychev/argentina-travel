import { describe, expect, it } from "vitest";
import {
  buildRouteMapPopupHtml,
  clusterRoutePointsByScreenDistance,
  formatRouteMapClusterLabel,
  formatRoutePointDisplayName,
} from "@/lib/tour-route-map";

describe("formatRoutePointDisplayName", () => {
  it("returns the primary segment from geocoded partner labels", () => {
    expect(
      formatRoutePointDisplayName(
        "Глясиар Перито Морено, Национальный парк Лос-Гласьярес, департамент Лаго-Архентино, Санта-Крус, Аргентина",
      ),
    ).toBe("Глясиар Перито Морено");
  });

  it("strips trailing country from city labels", () => {
    expect(formatRoutePointDisplayName("Эль-Калафате, Аргентина")).toBe("Эль-Калафате");
  });

  it("keeps short names unchanged", () => {
    expect(formatRoutePointDisplayName("Буэнос-Айрес")).toBe("Буэнос-Айрес");
  });
});

describe("buildRouteMapPopupHtml", () => {
  it("separates title and day on distinct lines", () => {
    const html = buildRouteMapPopupHtml(
      {
        id: "p1",
        name: "Буэнос-Айрес",
        lat: -34.6,
        lng: -58.38,
        dayNumber: 8,
      },
      "waypoint",
    );

    expect(html).toContain('class="route-map-popup-title"');
    expect(html).toContain("Буэнос-Айрес");
    expect(html).toContain('class="route-map-popup-day"');
    expect(html).toContain("День 8");
    expect(html).not.toContain("Буэнос-АйресДень");
  });

  it("renders photo when imageUrl is provided", () => {
    const html = buildRouteMapPopupHtml(
      {
        id: "p1",
        name: "Патагония",
        lat: -50,
        lng: -73,
        dayNumber: 3,
        imageUrl: "https://cf.youtravel.me/photos/sample.jpg",
      },
      "start",
    );

    expect(html).toContain('class="route-map-popup-photo"');
    expect(html).toContain("https://cf.youtravel.me/photos/sample.jpg");
    expect(html).toContain("Старт тура");
  });
});

describe("clusterRoutePointsByScreenDistance", () => {
  const points = [
    { id: "1", lat: -34.6, lng: -58.38 },
    { id: "2", lat: -34.61, lng: -58.39 },
    { id: "3", lat: -50, lng: -73 },
  ];

  it("merges overlapping screen positions", () => {
    const groups = clusterRoutePointsByScreenDistance(
      points,
      (index) => ({ x: index === 2 ? 200 : index * 10, y: 100 }),
      34,
    );

    expect(groups).toHaveLength(2);
    expect(groups.find((group) => group.indices.length === 2)?.indices).toEqual([0, 1]);
  });

  it("formats consecutive cluster labels as a range", () => {
    expect(formatRouteMapClusterLabel([5, 6, 7])).toBe("6–8");
    expect(formatRouteMapClusterLabel([0, 2, 4])).toBe("×3");
  });
});
