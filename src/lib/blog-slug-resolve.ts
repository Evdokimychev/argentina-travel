import { getBlogPostBySlug } from "@/data/blog";
import { BLOG_SLUG_MEDIA_FOLDER } from "@/lib/blog-media-path";

const LATIN_ALIAS_TO_CANONICAL = Object.fromEntries(
  Object.entries(BLOG_SLUG_MEDIA_FOLDER).map(([canonical, latin]) => [latin, canonical]),
);

/** Slug variants for CMS/TS lookup (latin alias ↔ cyrillic canonical). */
export function blogSlugLookupCandidates(rawSlug: string): string[] {
  const decoded = decodeURIComponent(rawSlug).normalize("NFC");
  const out = new Set<string>([rawSlug, decoded]);

  const fromLatin = LATIN_ALIAS_TO_CANONICAL[decoded];
  if (fromLatin) out.add(fromLatin);

  const toLatin = BLOG_SLUG_MEDIA_FOLDER[decoded];
  if (toLatin) out.add(toLatin);

  return [...out];
}

/** Canonical editorial slug from TS data when available. */
export function canonicalBlogSlug(rawSlug: string): string {
  for (const candidate of blogSlugLookupCandidates(rawSlug)) {
    if (getBlogPostBySlug(candidate)) return candidate;
  }
  return decodeURIComponent(rawSlug).normalize("NFC");
}

export function isBlogSlugPublished(slug: string, publishedSlugs: ReadonlySet<string>): boolean {
  return blogSlugLookupCandidates(slug).some((candidate) => publishedSlugs.has(candidate));
}

export function buildPublishedBlogSlugSet(slugs: Iterable<string>): Set<string> {
  const out = new Set<string>();
  for (const slug of slugs) {
    for (const candidate of blogSlugLookupCandidates(slug)) {
      out.add(candidate);
    }
  }
  return out;
}

/** ASCII-safe blog post path for redirects and external Location headers. */
export function blogPostPath(slug: string): string {
  return `/blog/${encodeURIComponent(slug)}`;
}

export function areBlogSlugsEquivalent(a: string, b: string): boolean {
  const normalize = (value: string) => decodeURIComponent(value).normalize("NFC");
  if (normalize(a) === normalize(b)) return true;

  const aliases = new Set(blogSlugLookupCandidates(a));
  return blogSlugLookupCandidates(b).some((candidate) => aliases.has(candidate));
}
