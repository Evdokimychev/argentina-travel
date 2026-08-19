/**
 * Sprint 7 — Content runtime ownership (steady state contract).
 * Cutover flags are migration switches with an explicit removal destiny.
 * Do not treat “flag false forever” as architecture.
 */

export type ContentFamilyId = "blog" | "guide" | "destination" | "place";

export type ContentRuntimeOwnership = {
  family: ContentFamilyId;
  /** Authoritative public render source when cutover is false (current default). */
  authoritativeWhenCutoverFalse: "typed_or_file_with_cms_overlay";
  /** Authoritative public render source when cutover is true. */
  authoritativeWhenCutoverTrue: "cms_canonical_with_typed_fallback";
  cutoverFlag: `cms${"Blog" | "Guide" | "Destination" | "Place"}Cutover`;
  /** Why the flag still exists. */
  reason: string;
  /** Concrete removal condition — not a vague “later”. */
  removalCondition: string;
  owner: string;
};

export const CONTENT_RUNTIME_OWNERSHIP: readonly ContentRuntimeOwnership[] = [
  {
    family: "blog",
    authoritativeWhenCutoverFalse: "typed_or_file_with_cms_overlay",
    authoritativeWhenCutoverTrue: "cms_canonical_with_typed_fallback",
    cutoverFlag: "cmsBlogCutover",
    reason: "Editorial still ships typed/manual posts; CMS overlay for drafts/metadata.",
    removalCondition:
      "All public blog slugs render from CMS with typed fallback only for disaster recovery; inventory:check + seo-audit green; then delete flag branch.",
    owner: "content-os",
  },
  {
    family: "guide",
    authoritativeWhenCutoverFalse: "typed_or_file_with_cms_overlay",
    authoritativeWhenCutoverTrue: "cms_canonical_with_typed_fallback",
    cutoverFlag: "cmsGuideCutover",
    reason: "Guide pillars remain file/typed-led with CMS enrichment.",
    removalCondition:
      "Guide hub + pillar pages proven CMS-canonical in staging; soft-degrade titles still work; then remove dual branch.",
    owner: "content-os",
  },
  {
    family: "destination",
    authoritativeWhenCutoverFalse: "typed_or_file_with_cms_overlay",
    authoritativeWhenCutoverTrue: "cms_canonical_with_typed_fallback",
    cutoverFlag: "cmsDestinationCutover",
    reason: "Destination landings use structured content + CMS documents.",
    removalCondition:
      "Every /destinations/* slug has CMS document + parity test; then collapse to CMS+fallback.",
    owner: "content-os",
  },
  {
    family: "place",
    authoritativeWhenCutoverFalse: "typed_or_file_with_cms_overlay",
    authoritativeWhenCutoverTrue: "cms_canonical_with_typed_fallback",
    cutoverFlag: "cmsPlaceCutover",
    reason: "Places primarily from geo data; optional Prisma/DB adapter; CMS projection optional.",
    removalCondition:
      "Place detail ownership ADR accepted (geo DB vs CMS) and one path deleted; Prisma remains niche adapter only.",
    owner: "geography",
  },
] as const;

export function contentOwnershipFor(family: ContentFamilyId): ContentRuntimeOwnership {
  const row = CONTENT_RUNTIME_OWNERSHIP.find((item) => item.family === family);
  if (!row) throw new Error(`Unknown content family: ${family}`);
  return row;
}

/**
 * Editorial families without a cutover flag. Do not add flags here —
 * the four cutover switches stay the only runtime toggles.
 */
export type EditorialOverlayFamilyId = "knowledge" | "landing";

export type EditorialOverlayOwnership = {
  family: EditorialOverlayFamilyId;
  canonicalStore: "markdown_or_typed_with_cms_overlay";
  writer: "cms_overlay_plus_repo_files";
  publicReader: "resolver_overlay_then_static";
  cutover: "none_do_not_mass_flip";
  reason: string;
  owner: string;
};

export const EDITORIAL_OVERLAY_OWNERSHIP: readonly EditorialOverlayOwnership[] = [
  {
    family: "knowledge",
    canonicalStore: "markdown_or_typed_with_cms_overlay",
    writer: "cms_overlay_plus_repo_files",
    publicReader: "resolver_overlay_then_static",
    cutover: "none_do_not_mass_flip",
    reason:
      "KB public pages still resolve markdown/content.json first; CMS overlay enriches drafts and metadata. Archive redirects live in knowledge-archive-redirects, not CMS archived status.",
    owner: "content-os",
  },
  {
    family: "landing",
    canonicalStore: "markdown_or_typed_with_cms_overlay",
    writer: "cms_overlay_plus_repo_files",
    publicReader: "resolver_overlay_then_static",
    cutover: "none_do_not_mass_flip",
    reason:
      "Landing pages are typed/file-led. CMS documents exist for editorial overlays only; no cutover flag.",
    owner: "content-os",
  },
];
