export type BlogReadingHistoryInput = {
  slug: string;
  title: string;
  category?: string;
  readAt?: string;
};

function normalizeSlug(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseBlogReadingHistoryInput(value: unknown): BlogReadingHistoryInput | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as {
    slug?: unknown;
    title?: unknown;
    category?: unknown;
    readAt?: unknown;
  };
  const slug = normalizeSlug(raw.slug);
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!slug || !title) return null;
  return {
    slug,
    title,
    category: typeof raw.category === "string" ? raw.category : undefined,
    readAt: typeof raw.readAt === "string" ? raw.readAt : undefined,
  };
}
