export type PublicDetailRoute = {
  kind: "tours" | "excursions" | "places" | "blog" | "author-articles";
  slug: string;
};

const BLOG_NON_DETAIL_SEGMENTS = new Set(["authors", "feed.xml"]);

export function matchPublicDetailPath(pathname: string): PublicDetailRoute | null {
  const authorMatch = pathname.match(/^\/blog\/author\/([^/]+)$/);
  if (authorMatch) return { kind: "author-articles", slug: authorMatch[1]! };

  const match = pathname.match(/^\/(tours|excursions|places|blog)\/([^/]+)$/);
  if (!match) return null;

  const kind = match[1] as PublicDetailRoute["kind"];
  const slug = match[2]!;
  if (kind === "blog" && BLOG_NON_DETAIL_SEGMENTS.has(slug)) return null;

  return { kind, slug };
}
