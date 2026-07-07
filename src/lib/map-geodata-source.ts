import type { GeoJSONSourceSpecification } from "maplibre-gl";

/** GeoJSON-источник без упрощения Douglas–Peucker — границы совпадают с OSM-тайлами на любом zoom. */
export const BOUNDARY_GEOJSON_SOURCE: Omit<GeoJSONSourceSpecification, "type" | "data"> = {
  tolerance: 0,
  buffer: 0,
  generateId: true,
};

export function boundaryGeoJsonSource(
  data: GeoJSONSourceSpecification["data"]
): GeoJSONSourceSpecification {
  return {
    type: "geojson",
    data,
    ...BOUNDARY_GEOJSON_SOURCE,
  };
}
