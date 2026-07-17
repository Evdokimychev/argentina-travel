import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MAP_THEMATIC_DATA_REGISTRY } from "@/data/map-thematic/layer-registry";
import {
  checkThematicLayerAvailable,
  clearThematicLayerCache,
  probeThematicLayerAvailability,
} from "@/lib/map-thematic-loader";

afterEach(() => {
  clearThematicLayerCache();
  vi.unstubAllGlobals();
});

describe("map-thematic layer registry", () => {
  it("does not point schematic inline geojson module", () => {
    for (const spec of Object.values(MAP_THEMATIC_DATA_REGISTRY)) {
      expect(spec.source.length).toBeGreaterThan(10);
    }
  });

  it("keeps every configured thematic data file in the public build", () => {
    for (const spec of Object.values(MAP_THEMATIC_DATA_REGISTRY)) {
      if (!spec.dataFile) continue;
      expect(fs.existsSync(path.join(process.cwd(), "public/geo/map", spec.dataFile))).toBe(true);
    }
  });

  it("marks ba_recommended as derived from official barrios", () => {
    const spec = MAP_THEMATIC_DATA_REGISTRY.ba_recommended;
    expect(spec.derivedFrom).toBe("ba_neighborhoods");
    expect(spec.dataFile).toBeNull();
  });

  it("marks argentina_border as derived from provinces", () => {
    const spec = MAP_THEMATIC_DATA_REGISTRY.argentina_border;
    expect(spec.derivedFrom).toBe("provinces");
    expect(spec.dataFile).toBeNull();
  });

  it("probes large GeoJSON resources with HEAD instead of downloading them", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkThematicLayerAvailable("provinces")).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/geo/map/provinces.geojson",
      expect.objectContaining({ method: "HEAD" }),
    );
  });

  it("derives availability from the parent without parsing its GeoJSON", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkThematicLayerAvailable("popular_regions")).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/geo/map/provinces.geojson",
      expect.objectContaining({ method: "HEAD" }),
    );
  });

  it("builds the map control availability without network fan-out", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await probeThematicLayerAvailability();

    expect(result.provinces).toBe(true);
    expect(result.popular_regions).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
