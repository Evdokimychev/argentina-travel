import { describe, expect, it } from "vitest";
import { rankMapObjects } from "@/lib/map-objects-server";
import type { MapObject } from "@/lib/map-types";

function object(id: string, patch: Partial<MapObject> = {}): MapObject {
  return {
    id,
    slug: id,
    kind: "attraction",
    title: id,
    latitude: -34,
    longitude: -58,
    region: "Buenos Aires",
    href: `/places/${id}`,
    importance: 50,
    featured: false,
    editorialPriority: 50,
    qualityScore: 50,
    source: "test",
    minZoom: 3,
    maxZoom: 18,
    tags: [],
    status: "published",
    ...patch,
  };
}

describe("rankMapObjects", () => {
  it("puts featured and editorially important objects first", () => {
    const result = rankMapObjects([
      object("standard", { editorialPriority: 80 }),
      object("featured", { featured: true, editorialPriority: 10 }),
      object("priority", { editorialPriority: 90 }),
    ]);
    expect(result.map((item) => item.id)).toEqual(["featured", "priority", "standard"]);
  });

  it("hides hidden objects and keeps the highest-quality duplicate", () => {
    const result = rankMapObjects([
      object("hidden", { status: "hidden" }),
      object("low", { slug: "same", qualityScore: 20 }),
      object("high", { slug: "same", qualityScore: 95 }),
    ]);
    expect(result.map((item) => item.id)).toEqual(["high"]);
  });
});
