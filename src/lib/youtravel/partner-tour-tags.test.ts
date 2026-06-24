import { describe, expect, it } from "vitest";
import {
  expandYouTravelTagLabels,
  resolveYouTravelThematicTags,
  resolveYouTravelThematicTagSet,
  YOUTRAVEL_THEMATIC_TAG_LIMIT,
} from "@/lib/youtravel/partner-tour-tags";
import type { YouTravelTour } from "@/lib/youtravel/types";

describe("expandYouTravelTagLabels", () => {
  it("splits comma-separated catalog labels", () => {
    expect(
      expandYouTravelTagLabels("Авторский, Поход, Экскурсионный, Тур в горы"),
    ).toEqual(["Авторский", "Поход", "Экскурсионный", "Тур в горы"]);
  });
});

describe("resolveYouTravelThematicTags", () => {
  it("collects tags from types, tags, main_type and activityType without duplicates", () => {
    const payload: YouTravelTour = {
      activityType: "Пешие туры",
      main_type: "Треккинг",
      types: ["Пешие туры", { title: "Патагония", main: true }],
      tags: ["Патагония", "Фототуры"],
    };

    expect(resolveYouTravelThematicTags(payload)).toEqual([
      "Треккинг",
      "Патагония",
      "Пешие туры",
      "Фототуры",
    ]);
  });

  it("splits comma-joined type field into separate tags", () => {
    const payload: YouTravelTour = {
      main_type: "Авторский",
      type: "Поход, Экскурсионный, Тур в горы, Для соло путешественников",
    };

    expect(resolveYouTravelThematicTags(payload)).toEqual([
      "Авторский",
      "Поход",
      "Экскурсионный",
      "Тур в горы",
    ]);
  });

  it("skips generic catalog labels and limits to four", () => {
    const payload: YouTravelTour = {
      tags: [
        "Партнёр YouTravel",
        "Авторские",
        "Групповые",
        "Все",
        "Сафари",
        "Рафтинг",
        "Каякинг",
        "Винные туры",
      ],
    };

    const tags = resolveYouTravelThematicTags(payload);
    expect(tags.length).toBeLessThanOrEqual(YOUTRAVEL_THEMATIC_TAG_LIMIT);
    expect(tags).not.toContain("Партнёр YouTravel");
    expect(tags).not.toContain("Авторские");
    expect(tags).toEqual(["Сафари", "Рафтинг", "Каякинг", "Винные туры"]);
  });

  it("returns empty array when no usable tags", () => {
    expect(resolveYouTravelThematicTags({ tags: ["Все", "Групповые"] })).toEqual([]);
  });
});

describe("resolveYouTravelThematicTagSet", () => {
  it("returns main tag and others", () => {
    const payload: YouTravelTour = {
      main_type: "Авторский",
      type: "Поход, Экскурсионный",
    };

    expect(resolveYouTravelThematicTagSet(payload)).toEqual({
      mainTag: "Авторский",
      otherTags: ["Поход", "Экскурсионный"],
    });
  });
});
