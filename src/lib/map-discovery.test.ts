import { describe, expect, it } from "vitest";
import {
  findNearbyMapObjects,
  mapDistanceKm,
  matchesMapDiscoveryMode,
  parseMapDiscoveryMode,
} from "@/lib/map-discovery";
import type { MapObject } from "@/lib/map-types";

function object(partial: Partial<MapObject> = {}): MapObject {
  return {
    id: partial.id ?? "object",
    slug: partial.slug ?? "object",
    kind: partial.kind ?? "attraction",
    title: partial.title ?? "Объект",
    latitude: partial.latitude ?? -50.337,
    longitude: partial.longitude ?? -72.264,
    region: partial.region ?? "Патагония",
    href: partial.href ?? "/places/object",
    ...partial,
  };
}

describe("map discovery", () => {
  it("keeps tourist modes separate from technical marker kinds", () => {
    expect(matchesMapDiscoveryMode(object({ category: "glacier" }), "nature")).toBe(true);
    expect(matchesMapDiscoveryMode(object({ category: "museum" }), "culture")).toBe(true);
    expect(matchesMapDiscoveryMode(object({ kind: "excursion" }), "things_to_do")).toBe(true);
    expect(matchesMapDiscoveryMode(object({ kind: "airport" }), "getting_around")).toBe(true);
  });

  it("shows only editorially important objects in highlights, except national parks", () => {
    expect(matchesMapDiscoveryMode(object({ featured: true }), "highlights")).toBe(true);
    expect(matchesMapDiscoveryMode(object({ kind: "national_park" }), "highlights")).toBe(true);
    expect(matchesMapDiscoveryMode(object({ featured: false }), "highlights")).toBe(false);
  });

  it("falls back to highlights for unknown URL values", () => {
    expect(parseMapDiscoveryMode("nature")).toBe("nature");
    expect(parseMapDiscoveryMode("unknown")).toBe("highlights");
  });

  it("finds and sorts nearby map objects", () => {
    const selected = object({ id: "calafate" });
    const nearby = object({ id: "lagoon", latitude: -50.34, longitude: -72.27 });
    const farther = object({ id: "glacier", latitude: -50.496, longitude: -73.048 });
    const result = findNearbyMapObjects(selected, [farther, selected, nearby]);
    expect(result.map((item) => item.object.id)).toEqual(["lagoon", "glacier"]);
    expect(mapDistanceKm(selected, farther)).toBeGreaterThan(50);
  });
});
