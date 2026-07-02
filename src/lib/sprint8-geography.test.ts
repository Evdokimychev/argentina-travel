import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { POPULAR_DESTINATIONS } from "@/data/filters";
import { DESTINATION_PAGES } from "@/data/destination-pages";
import { PLACES_SEED } from "@/data/places-seed";
import { buildMapTourDeepLink } from "@/lib/map-argentina-url-state";
import { MAP_KIND_COLORS } from "@/lib/map-kind-colors";

const root = join(process.cwd(), "src");

describe("Sprint 8 — geography & map", () => {
  it("map hub has legend, popup v2 and mobile bottom sheet", () => {
    const hub = readFileSync(join(root, "components/map/ArgentinaMapFullscreenHub.tsx"), "utf8");
    expect(hub).toContain("MapControlsPanel");
    expect(hub).toContain("MapObjectPopup");
    const controls = readFileSync(join(root, "components/map/MapControlsPanel.tsx"), "utf8");
    expect(controls).toContain("MapLegend");
    const card = readFileSync(join(root, "components/map/MapObjectCard.tsx"), "utf8");
    expect(card).toContain("Страница тура");
    expect(card).toContain("Подробнее");
    const popup = readFileSync(join(root, "components/map/MapObjectPopup.tsx"), "utf8");
    expect(popup).toContain("bottomSheet");
    expect(popup).toContain("max-width: 767px");
  });

  it("map kind colors shared between canvas and legend", () => {
    const inner = readFileSync(join(root, "components/map/ArgentinaMapLibreCanvasInner.tsx"), "utf8");
    expect(inner).toContain("MAP_KIND_COLORS");
    expect(inner).toContain("registerMapMarkerImages");
    expect(inner).toContain("unclustered-marker");
    expect(Object.keys(MAP_KIND_COLORS).length).toBeGreaterThanOrEqual(7);
  });

  it("legacy /map redirects to mapa-argentina", () => {
    const legacy = readFileSync(join(root, "app/map/page.tsx"), "utf8");
    expect(legacy).toContain("redirect(");
    expect(legacy).toContain("/mapa-argentina");
    expect(legacy).not.toContain("ArgentinaMapHub");
  });

  it("destination pages use HubQuickFactsGrid and 3-up gallery", () => {
    const view = readFileSync(join(root, "components/destinations/DestinationDetailView.tsx"), "utf8");
    expect(view).toContain("HubQuickFactsGrid");
    expect(view).toContain("sm:grid-cols-3");
    expect(view).toContain("min-h-[56vh]");
    expect(DESTINATION_PAGES.length).toBe(POPULAR_DESTINATIONS.length);
    expect(DESTINATION_PAGES.length).toBe(8);
  });

  it("place pages combine transport and map with tour strip", () => {
    const view = readFileSync(join(root, "components/places/PlaceDetailView.tsx"), "utf8");
    expect(view).toContain("PlaceTransportMapSection");
    expect(view).toContain('variant: "strip"');
    expect(view).toContain("matchToursForPlace");
    const transport = readFileSync(join(root, "components/places/PlaceTransportMapSection.tsx"), "utf8");
    expect(transport).toContain("PlaceDetailMap");
    expect(transport).toContain("buildMapPlaceDeepLink");
  });

  it("all seed places have coordinates for map", () => {
    const withCoords = PLACES_SEED.filter(
      (p) => typeof p.latitude === "number" && typeof p.longitude === "number"
    );
    expect(withCoords.length).toBeGreaterThanOrEqual(20);
    expect(withCoords.length).toBe(PLACES_SEED.length);
  });

  it("tour detail links to map hub", () => {
    const route = readFileSync(join(root, "components/tour-detail/RouteMapSection.tsx"), "utf8");
    expect(route).toContain("buildMapTourDeepLink");
    expect(route).toContain("Показать на карте");
    const link = buildMapTourDeepLink({ id: "1", slug: "patagonia-glaciers" });
    expect(link).toContain("/mapa-argentina");
    expect(link).toContain("selected=tour%3A1");
  });
});
