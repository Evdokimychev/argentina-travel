import type { BlogBodyBlock, BlogEditorialDensity } from "@/types/blog-content-blocks";

export type EditorialLocale = "ru" | "es" | "en";

export type EditorialThemeSupport = "light" | "dark" | "both";

export type EditorialMobileBehaviour =
  | "stack"
  | "cards"
  | "tabs"
  | "scroll"
  | "collapse"
  | "keep";

export type EditorialSeoBehaviour =
  | "content"
  | "decorative"
  | "structured-data"
  | "ignore";

export type EditorialBlockType = BlogBodyBlock["type"];

export type EditorialRegistryEntry = {
  type: EditorialBlockType;
  label: string;
  description: string;
  group: "content" | "media" | "widgets" | "travel" | "commerce" | "trust" | "layout";
  supportedThemes: EditorialThemeSupport;
  mobileBehaviour: EditorialMobileBehaviour;
  accessibilityNotes: string;
  seoBehaviour: EditorialSeoBehaviour;
  localizationSupport: boolean;
  allowedChildren: EditorialBlockType[];
  minItems?: number;
  maxItems?: number;
  deprecatedAliases?: string[];
  densityDefault?: BlogEditorialDensity;
  status: "stable" | "new" | "legacy" | "deprecated";
};

export type EditorialRhythmWarning = {
  code: string;
  message: string;
  index?: number;
};

export type EditorialAuditFinding = {
  level: "error" | "warning" | "info";
  code: string;
  message: string;
  slug?: string;
  sectionTitle?: string;
  blockType?: string;
  index?: number;
};
