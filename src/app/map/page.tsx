import { redirect } from "next/navigation";

type MapLegacyRedirectProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy /map — перенаправление на каноническую карту (next.config 301 + runtime fallback). */
export default async function MapLegacyRedirectPage({ searchParams }: MapLegacyRedirectProps) {
  const raw = await searchParams;
  const params = new URLSearchParams();

  const layer = typeof raw.layer === "string" ? raw.layer : "";
  if (layer) {
    const kinds: string[] = [];
    if (layer.includes("tours")) kinds.push("tour", "route");
    if (layer.includes("places")) kinds.push("city", "national_park", "attraction");
    if (layer.includes("routes")) kinds.push("route");
    if (kinds.length) params.set("kind", [...new Set(kinds)].join(","));
  }

  if (typeof raw.city === "string" && raw.city) params.set("city", raw.city);
  if (typeof raw.q === "string" && raw.q) params.set("q", raw.q);
  if (typeof raw.selected === "string" && raw.selected) params.set("selected", raw.selected);

  const qs = params.toString();
  redirect(qs ? `/mapa-argentina?${qs}` : "/mapa-argentina");
}
