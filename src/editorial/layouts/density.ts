import type { BlogEditorialDensity } from "@/types/blog-content-blocks";

/** Mobile viewports default to compact unless explicitly spacious. */
export function resolveEditorialDensity(
  density: BlogEditorialDensity | undefined,
  opts: { isMobile?: boolean } = {},
): BlogEditorialDensity {
  if (density === "spacious" && opts.isMobile) return "comfortable";
  if (!density && opts.isMobile) return "compact";
  return density ?? "comfortable";
}

export const DENSITY_STACK_CLASS: Record<BlogEditorialDensity, string> = {
  compact: "space-y-3",
  comfortable: "space-y-5",
  spacious: "space-y-8",
};
