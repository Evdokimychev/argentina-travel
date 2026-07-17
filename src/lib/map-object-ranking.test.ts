import { describe, expect, it } from "vitest";
import {
  rankMapObjects,
  selectTransportHubsForMap,
} from "@/lib/map-objects-server";
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

describe("selectTransportHubsForMap", () => {
  const canonicalIatas = ["EZE", "AEP", "BRC", "IGR", "USH"];

  it("removes airport-shaped transport hubs when canonical airports are present", () => {
    const hubs = selectTransportHubsForMap(true);
    expect(hubs.some((hub) => hub.kind === "bus_terminal")).toBe(true);
    for (const iata of canonicalIatas) {
      expect(hubs.some((hub) => hub.iata === iata)).toBe(false);
    }
  });

  it("keeps transport airport hubs when the canonical airport layer is absent", () => {
    const hubs = selectTransportHubsForMap(false);
    for (const iata of canonicalIatas) {
      expect(hubs.some((hub) => hub.iata === iata)).toBe(true);
    }
  });
});
