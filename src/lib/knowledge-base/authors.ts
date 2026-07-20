import type { KbEntry } from "@/lib/knowledge-base/types";

export type KbAuthorProfile = {
  slug: string;
  name: string;
  bio?: string;
  avatar?: string;
  entries: KbEntry[];
};

function normalizeAuthorSlug(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ru")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isVerifiedKbAuthorEntry(entry: KbEntry): boolean {
  return Boolean(
    entry.author_name?.trim() &&
      entry.personal_experience === true &&
      entry.verified_by_ivan === true,
  );
}

export function getKbAuthorSlug(entry: KbEntry): string | undefined {
  if (!entry.author_name?.trim()) return undefined;
  const slug = normalizeAuthorSlug(entry.author_slug?.trim() || entry.author_name);
  return slug || undefined;
}

export function buildKbAuthorProfiles(entries: KbEntry[]): KbAuthorProfile[] {
  const bySlug = new Map<string, KbAuthorProfile>();

  for (const entry of entries) {
    if (!isVerifiedKbAuthorEntry(entry)) continue;
    const name = entry.author_name?.trim();
    if (!name) continue;
    const slug = getKbAuthorSlug(entry);
    if (!slug) continue;

    const existing = bySlug.get(slug);
    if (existing) {
      existing.entries.push(entry);
      existing.bio ||= entry.author_bio?.trim() || undefined;
      existing.avatar ||= entry.author_avatar?.trim() || undefined;
      continue;
    }

    bySlug.set(slug, {
      slug,
      name,
      bio: entry.author_bio?.trim() || undefined,
      avatar: entry.author_avatar?.trim() || undefined,
      entries: [entry],
    });
  }

  return [...bySlug.values()]
    .map((profile) => ({
      ...profile,
      entries: profile.entries.sort((a, b) => a.title.localeCompare(b.title, "ru")),
    }))
    .sort((a, b) => b.entries.length - a.entries.length || a.name.localeCompare(b.name, "ru"));
}

export function getKbAuthorProfile(
  slug: string,
  entries: KbEntry[],
): KbAuthorProfile | undefined {
  return buildKbAuthorProfiles(entries).find((profile) => profile.slug === slug);
}
