import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("public Argentina map performance contract", () => {
  it("does not fetch the 14 MB province geometry during the default map load", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/components/map/ArgentinaMapLibreCanvasInner.tsx"),
      "utf8",
    );

    expect(source).not.toContain("fetch(`${MAP_GEODATA_BASE_PATH}/provinces.geojson`");
    expect(source).toContain("ensureThematicLayerData(map, layerId)");
  });

  it("checks individual resources with HEAD and opens controls without network fan-out", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/lib/map-thematic-loader.ts"),
      "utf8",
    );

    expect(source).toContain('method: "HEAD"');
    expect(source).toContain("Avoid a fan-out of network probes");
    expect(source).not.toContain("const data = await fetchGeoJson(url);\n  const ok = data !== null");
  });
});
