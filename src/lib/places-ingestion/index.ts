import { createIngestionPipeline } from "./types";
import { osmNominatimFetcher } from "./osm";
import { overpassFetcher } from "./overpass";
import { wikipediaFetcher } from "./wikipedia";
import { wikidataFetcher } from "./wikidata";
import { geonamesFetcher } from "./geonames";

export * from "./types";
export { osmNominatimFetcher } from "./osm";
export { overpassFetcher, buildOverpassQuery } from "./overpass";
export { wikipediaFetcher } from "./wikipedia";
export { wikidataFetcher } from "./wikidata";
export { geonamesFetcher } from "./geonames";

/** Default ingestion pipeline with all registered fetchers. */
export const placesIngestionPipeline = createIngestionPipeline([
  osmNominatimFetcher,
  overpassFetcher,
  wikipediaFetcher,
  wikidataFetcher,
  geonamesFetcher,
]);
