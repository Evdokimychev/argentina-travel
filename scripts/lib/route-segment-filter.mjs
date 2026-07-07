/**
 * Фильтрация OSM-сегментов национальных трасс — убирает ответвления, link-roads и составные ref.
 */

/** @param {string | number | null | undefined} ref @param {string | number} routeNumber */
export function isNationalRouteRef(ref, routeNumber) {
  if (ref == null || ref === "") return false;
  const value = String(ref).trim();
  if (value.includes(";")) return false;

  const num = String(routeNumber);
  const upper = value.toUpperCase().replace(/\s+/g, " ");

  if (upper === num) return true;
  if (upper === `RN ${num}` || upper === `RN${num}`) return true;
  if (upper === `RUTA ${num}` || upper === `RUTA${num}`) return true;
  return false;
}

/** @param {string | null | undefined} highway */
export function isMainHighway(highway) {
  if (!highway) return false;
  if (String(highway).includes("_link")) return false;
  return ["trunk", "primary", "secondary"].includes(String(highway));
}

/** @param {[number, number][]} coords */
export function segmentLengthKm(coords) {
  if (!coords || coords.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < coords.length; i += 1) {
    total += haversineKm(coords[i - 1], coords[i]);
  }
  return total;
}

/** @param {[number, number]} a @param {[number, number]} b */
function haversineKm(a, b) {
  const R = 6371;
  const d2r = Math.PI / 180;
  const dLat = (b[1] - a[1]) * d2r;
  const dLon = (b[0] - a[0]) * d2r;
  const lat1 = a[1] * d2r;
  const lat2 = b[1] * d2r;
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * @param {import("geojson").Feature[]} features
 * @param {string | number} routeNumber
 * @param {{ minPoints?: number; minKm?: number }} [opts]
 */
export function filterRouteSegments(features, routeNumber, opts = {}) {
  const minPoints = opts.minPoints ?? 4;
  const minKm = opts.minKm ?? 0.5;

  return features.filter((feature) => {
    const props = feature.properties ?? {};
    const ref = props.ref ?? props["ref:AR:national"] ?? "";
    const nationalRef = props["ref:AR:national"] ?? "";
    const refMatch =
      isNationalRouteRef(ref, routeNumber) || isNationalRouteRef(nationalRef, routeNumber);
    if (!refMatch) return false;

    if (props.highway && !isMainHighway(props.highway)) return false;

    const coords = feature.geometry?.type === "LineString" ? feature.geometry.coordinates : [];
    if (coords.length < minPoints) return false;
    if (segmentLengthKm(coords) < minKm) return false;

    return true;
  });
}

/** @param {import("geojson").Feature} feature @param {number} [maxDetourRatio] */
export function isReasonableOsrmRoute(feature, maxDetourRatio = 3.5) {
  const coords = feature.geometry?.type === "LineString" ? feature.geometry.coordinates : [];
  if (coords.length < 2) return false;
  const pathKm = segmentLengthKm(coords);
  const directKm = haversineKm(coords[0], coords[coords.length - 1]);
  if (directKm < 0.5) return pathKm < 50;
  return pathKm / directKm <= maxDetourRatio;
}

/** @param {import("geojson").Feature} feature @param {Record<string, unknown>} [extra] */
export function normalizeRouteFeature(feature, extra = {}) {
  return {
    type: "Feature",
    properties: {
      ...(feature.properties ?? {}),
      name: feature.properties?.name ?? extra.name ?? "Маршрут",
      ...extra,
    },
    geometry: feature.geometry,
  };
}
