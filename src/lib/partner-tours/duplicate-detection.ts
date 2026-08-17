/**
 * Probable duplicate detection across marketplace listings.
 * Non-destructive: emits moderation signals only — never auto-merges partners.
 */

export type DuplicateSignalInput = {
  id: string;
  partnerSource?: string | null;
  partnerExternalId?: string | number | null;
  title: string;
  destination?: string | null;
  country?: string | null;
  durationDays?: number | null;
};

export type ProbableDuplicateGroup = {
  key: string;
  listingIds: string[];
  reason: "same_partner_id" | "similar_title_route";
};

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[«»""']/g, "")
    .replace(/[^a-zа-яё0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function partnerKey(input: DuplicateSignalInput): string | null {
  if (!input.partnerSource || input.partnerExternalId == null) return null;
  return `${input.partnerSource}:${String(input.partnerExternalId)}`;
}

function similarityKey(input: DuplicateSignalInput): string {
  const title = normalizeTitle(input.title);
  const place = normalizeTitle(
    [input.destination, input.country].filter(Boolean).join(" "),
  );
  const duration = input.durationDays != null ? String(input.durationDays) : "";
  return `${title}|${place}|${duration}`;
}

/**
 * Detect same-partner ID collisions and cross-partner similar title/route groups.
 */
export function detectProbableDuplicates(
  listings: DuplicateSignalInput[],
): ProbableDuplicateGroup[] {
  const byPartnerId = new Map<string, string[]>();
  const bySimilarity = new Map<string, string[]>();

  for (const listing of listings) {
    const partner = partnerKey(listing);
    if (partner) {
      const bucket = byPartnerId.get(partner) ?? [];
      bucket.push(listing.id);
      byPartnerId.set(partner, bucket);
    }

    const similar = similarityKey(listing);
    if (similar.replace(/\|/g, "").length >= 12) {
      const bucket = bySimilarity.get(similar) ?? [];
      bucket.push(listing.id);
      bySimilarity.set(similar, bucket);
    }
  }

  const groups: ProbableDuplicateGroup[] = [];

  for (const [key, listingIds] of byPartnerId) {
    const unique = [...new Set(listingIds)];
    if (unique.length > 1) {
      groups.push({ key, listingIds: unique, reason: "same_partner_id" });
    }
  }

  for (const [key, listingIds] of bySimilarity) {
    const unique = [...new Set(listingIds)];
    if (unique.length < 2) continue;
    const partners = new Set(
      listings
        .filter((row) => unique.includes(row.id))
        .map((row) => row.partnerSource ?? "platform"),
    );
    // Same partner + same title is usually intentional re-list noise handled above.
    if (partners.size < 2 && !groups.some((g) => g.key === key)) {
      // Still flag identical fingerprint within one partner if IDs differ.
      if (unique.length > 1) {
        groups.push({ key, listingIds: unique, reason: "similar_title_route" });
      }
      continue;
    }
    if (partners.size >= 2) {
      groups.push({ key, listingIds: unique, reason: "similar_title_route" });
    }
  }

  return groups;
}
