import { describe, expect, it } from "vitest";
import {
  mapYouTravelLocationsToRoutePoints,
  resolveYouTravelDayLocationNames,
  resolveYouTravelRoutePoints,
} from "@/lib/youtravel/partner-tour-route";
import type { YouTravelProgramDay } from "@/lib/youtravel/types";

const SAMPLE_DAYS: YouTravelProgramDay[] = [
  {
    day: 1,
    title: "Буэнос-Айрес",
    locations_data: [
      { name: "Буэнос-Айрес", cord_x: -58.3816, cord_y: -34.6037, location_id: 101 },
      { name: "Канал Бигл", cord_x: -67.2712, cord_y: -54.8019, location_id: 102 },
    ],
  },
  {
    day: 2,
    title: "Ушуайя",
    locations_data: [
      { name: "Канал Бигл", cord_x: -67.2712, cord_y: -54.8019, location_id: 102 },
      { name: "Ушуайя", cord_x: -68.3029, cord_y: -54.8019, location_id: 103 },
    ],
  },
  {
    day: 3,
    title: "Патагония",
    locations_data: [
      { name: "Торрес-дель-Пайне", cord_x: -72.987, cord_y: -51.069, location_id: 104 },
      { name: "", cord_x: -72.0, cord_y: -51.0, location_id: 105 },
      { name: "Нулевые координаты", cord_x: 0, cord_y: 0, location_id: 106 },
    ],
  },
];

describe("mapYouTravelLocationsToRoutePoints", () => {
  it("maps cord_y to lat and cord_x to lng", () => {
    const points = mapYouTravelLocationsToRoutePoints([
      {
        day: 1,
        locations_data: [{ name: "Буэнос-Айрес", cord_x: -58.38, cord_y: -34.6, location_id: 1 }],
      },
    ]);

    expect(points).toEqual([
      {
        id: "yt-loc-1",
        name: "Буэнос-Айрес",
        lat: -34.6,
        lng: -58.38,
        dayNumber: 1,
        imageUrl: undefined,
      },
    ]);
  });

  it("dedupes by location_id and preserves day order", () => {
    const points = mapYouTravelLocationsToRoutePoints(SAMPLE_DAYS);

    expect(points.map((point) => point.name)).toEqual([
      "Буэнос-Айрес",
      "Канал Бигл",
      "Ушуайя",
      "Торрес-дель-Пайне",
    ]);
    expect(points.find((point) => point.name === "Канал Бигл")?.dayNumber).toBe(1);
  });

  it("skips locations without name or valid coordinates", () => {
    const points = mapYouTravelLocationsToRoutePoints(SAMPLE_DAYS);
    expect(points.some((point) => point.id === "yt-loc-105")).toBe(false);
    expect(points.some((point) => point.id === "yt-loc-106")).toBe(false);
  });

  it("corrects YouTravel city coords when API returns wrong region", () => {
    const points = mapYouTravelLocationsToRoutePoints([
      {
        day: 1,
        locations_data: [
          {
            name: "Эль-Калафате, Аргентина",
            cord_x: -65.200958,
            cord_y: -26.828546,
            location_id: 2211,
          },
          {
            name: "Эль Чалтен, Аргентина",
            cord_x: -60.819271,
            cord_y: -32.9291,
            location_id: 2210,
          },
        ],
      },
    ]);

    expect(points[0]?.name).toBe("Эль-Калафате, Аргентина");
    expect(points[0]?.lat).toBeLessThan(-49);
    expect(points[0]?.lng).toBeLessThan(-71);
    expect(points[1]?.name).toBe("Эль Чалтен, Аргентина");
    expect(points[1]?.lat).toBeLessThan(-48);
    expect(points[1]?.lng).toBeLessThan(-71);
  });

  it("keeps precise POI coords when they are near the labeled city", () => {
    const points = mapYouTravelLocationsToRoutePoints([
      {
        day: 1,
        locations_data: [
          {
            name: "Уshуайя, Аргентина",
            cord_x: -68.30444,
            cord_y: -54.80722,
            location_id: 3001,
          },
          {
            name: "Глясиар Перито Морено, Национальный парк Лос-Гласьярес",
            cord_x: -73.032677,
            cord_y: -50.474701,
            location_id: 3002,
          },
        ],
      },
    ]);

    expect(points[0]?.lat).toBeCloseTo(-54.80722, 4);
    expect(points[0]?.lng).toBeCloseTo(-68.30444, 4);
    expect(points[1]?.lat).toBeCloseTo(-50.474701, 4);
    expect(points[1]?.lng).toBeCloseTo(-73.032677, 4);
  });

  it("accepts locationsData camelCase alias", () => {
    const points = mapYouTravelLocationsToRoutePoints([
      {
        dayNumber: 4,
        locationsData: [{ name: "Барилоче", cord_x: -71.31, cord_y: -41.13, location_id: 201 }],
      },
    ]);

    expect(points).toEqual([
      {
        id: "yt-loc-201",
        name: "Барилоче",
        lat: -41.13,
        lng: -71.31,
        dayNumber: 4,
        imageUrl: undefined,
      },
    ]);
  });

  it("attaches first program day photo to route points", () => {
    const points = mapYouTravelLocationsToRoutePoints([
      {
        day: 8,
        photos: [{ src: "tours/day8.jpg", host: "cf.youtravel.me" }],
        locations_data: [
          { name: "Буэнос-Айрес", cord_x: -58.38, cord_y: -34.6, location_id: 1 },
        ],
      },
    ]);

    expect(points[0]?.imageUrl).toBe("https://cf.youtravel.me/tours/day8.jpg");
  });
});

describe("resolveYouTravelDayLocationNames", () => {
  it("returns ordered names deduplicated by location_id within a day", () => {
    expect(
      resolveYouTravelDayLocationNames({
        day: 1,
        locations_data: [
          { name: "Буэнос-Айрес", location_id: 101 },
          { name: "Буэнос-Айрес", location_id: 101 },
          { name: "Канал Бигл", location_id: 102 },
        ],
      }),
    ).toEqual(["Буэнос-Айрес", "Канал Бигл"]);
  });

  it("accepts locationsData camelCase alias and skips empty names", () => {
    expect(
      resolveYouTravelDayLocationNames({
        dayNumber: 2,
        locationsData: [
          { name: "  ", location_id: 1 },
          { name: "Барилоче", location_id: 201 },
        ],
      }),
    ).toEqual(["Барилоче"]);
  });
});

describe("resolveYouTravelRoutePoints", () => {
  it("reads program days from flexible payload shapes", () => {
    const points = resolveYouTravelRoutePoints({
      days: SAMPLE_DAYS,
    });

    expect(points).toHaveLength(4);
    expect(points[1]?.name).toBe("Канал Бигл");
  });

  it("returns empty array when program has no locations", () => {
    expect(resolveYouTravelRoutePoints({ days: [{ day: 1, title: "День 1" }] })).toEqual([]);
  });
});
