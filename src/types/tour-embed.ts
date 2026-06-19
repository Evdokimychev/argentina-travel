/** Варианты встраиваемых виджетов туров (Trips Embedder). */
export type TourEmbedVariant =
  | "grid"
  | "featured"
  | "compact-list"
  | "strip"
  | "spotlight";

export type TourEmbedPreset = "recommended" | "hot" | "new" | "best-of-month";

export type TourEmbedSource =
  | { kind: "slugs"; slugs: string[] }
  | { kind: "destination"; destinationSlug: string }
  | { kind: "region"; region: string }
  | { kind: "query"; query: string }
  | { kind: "preset"; preset: TourEmbedPreset }
  | { kind: "organizer"; organizerSlug: string };

export type TourEmbedTone = "default" | "muted" | "inline";

export type TourEmbedTheme = "light" | "dark";

export interface TourEmbedConfig {
  id?: string;
  variant: TourEmbedVariant;
  title: string;
  subtitle?: string;
  limit?: number;
  source: TourEmbedSource;
  catalogHref?: string;
  catalogLabel?: string;
  tone?: TourEmbedTone;
  theme?: TourEmbedTheme;
}
