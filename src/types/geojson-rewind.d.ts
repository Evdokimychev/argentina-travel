declare module "@mapbox/geojson-rewind" {
  import type { Feature, FeatureCollection } from "geojson";

  export default function rewind(
    geojson: Feature | FeatureCollection,
    outer?: boolean
  ): Feature | FeatureCollection;
}
