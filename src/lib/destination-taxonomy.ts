import type { DestinationPage } from "@/data/destination-pages";
import { formatWithWord } from "@/lib/pluralize";

export type DestinationGeographyKind =
  | "city"
  | "province"
  | "macroregion"
  | "destination";

export interface DestinationTaxonomy {
  kind: DestinationGeographyKind;
  kindLabel: string;
  administrativeArea: string;
}

const DESTINATION_KIND_LABELS: Record<DestinationGeographyKind, string> = {
  city: "Город",
  province: "Провинция",
  macroregion: "Макрорегион",
  destination: "Направление",
};

const KNOWN_DESTINATION_TAXONOMY: Record<
  string,
  Pick<DestinationTaxonomy, "kind" | "administrativeArea">
> = {
  ba: { kind: "city", administrativeArea: "Автономный город Буэнос-Айрес" },
  bariloche: { kind: "city", administrativeArea: "Провинция Рио-Негро" },
  calafate: { kind: "city", administrativeArea: "Провинция Санта-Крус" },
  ushuaia: { kind: "city", administrativeArea: "Провинция Огненная Земля" },
  iguazu: { kind: "city", administrativeArea: "Провинция Мисьонес" },
  mendoza: { kind: "city", administrativeArea: "Провинция Мендоса" },
  salta: { kind: "city", administrativeArea: "Провинция Сальта" },
  patagonia: { kind: "macroregion", administrativeArea: "Юг Аргентины" },
};

export function resolveDestinationTaxonomy(
  destination: Pick<DestinationPage, "id" | "region">,
): DestinationTaxonomy {
  const known = KNOWN_DESTINATION_TAXONOMY[destination.id];
  const kind = known?.kind ?? "destination";
  return {
    kind,
    kindLabel: DESTINATION_KIND_LABELS[kind],
    administrativeArea: known?.administrativeArea ?? destination.region,
  };
}

export function formatDestinationTaxonomySummary(
  destinations: Array<Pick<DestinationPage, "id" | "region">>,
): string {
  const counts = new Map<DestinationGeographyKind, number>();
  for (const destination of destinations) {
    const kind = resolveDestinationTaxonomy(destination).kind;
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }

  const parts = [
    counts.get("city")
      ? formatWithWord(counts.get("city")!, "город", "города", "городов")
      : "",
    counts.get("province")
      ? formatWithWord(counts.get("province")!, "провинция", "провинции", "провинций")
      : "",
    counts.get("macroregion")
      ? formatWithWord(
          counts.get("macroregion")!,
          "макрорегион",
          "макрорегиона",
          "макрорегионов",
        )
      : "",
    counts.get("destination")
      ? formatWithWord(
          counts.get("destination")!,
          "направление",
          "направления",
          "направлений",
        )
      : "",
  ].filter(Boolean);

  return parts.join(" · ");
}
