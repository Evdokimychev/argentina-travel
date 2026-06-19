import type { Metadata } from "next";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { parseMapLayersParam } from "@/lib/map-url-state";

const LAYER_LABELS: Record<string, string> = {
  tours: "туры",
  places: "места",
  regions: "регионы",
  routes: "маршруты",
};

export function buildMapPageMetadata(
  searchParams: Record<string, string | string[] | undefined>
): Metadata {
  const layerRaw = typeof searchParams.layer === "string" ? searchParams.layer : null;
  const layers = parseMapLayersParam(layerRaw);
  const city = typeof searchParams.city === "string" ? searchParams.city.trim() : "";
  const layerLabel = layers.map((layer) => LAYER_LABELS[layer] ?? layer).join(", ");

  const title = city
    ? `Карта Аргентины — ${city}`
    : layers.length === 1 && layers[0] === "tours"
      ? "Карта туров по Аргентине"
      : `Карта Аргентины — ${layerLabel}`;

  const description = city
    ? `Интерактивная карта Аргентины: ${layerLabel} в регионе ${city}. Туры, места, провинции и маршруты на одной карте.`
    : "Интерактивная карта Аргентины: туры, места, провинции и маршруты. Фильтры, слои и список рядом с картой.";

  return {
    title,
    description,
    alternates: buildHreflangAlternates("/map"),
    openGraph: {
      title,
      description,
      url: "/map",
      type: "website",
    },
  };
}
