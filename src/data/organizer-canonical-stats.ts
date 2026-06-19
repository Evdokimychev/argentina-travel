import { DEFAULT_ORGANIZER_OWNER_ID } from "@/types/user";

/** Verified public counters — not derived from demo tour seed. */
export interface OrganizerCanonicalPublicStats {
  tourCount: number;
  travelerCount: number;
  /** ISO date for «С YYYY года» on profile and tour pages. */
  platformRegisteredAt: string;
}

/**
 * Canonical organizer metrics confirmed by the project owner.
 * TODO: move to organizer settings / Supabase when CMS for stats exists.
 */
export const ORGANIZER_CANONICAL_STATS: Record<string, OrganizerCanonicalPublicStats> = {
  [DEFAULT_ORGANIZER_OWNER_ID]: {
    tourCount: 0,
    travelerCount: 235,
    platformRegisteredAt: "2023-01-01T00:00:00.000Z",
  },
};

export function getOrganizerCanonicalStats(
  ownerUserId?: string | null,
): OrganizerCanonicalPublicStats | null {
  if (!ownerUserId?.trim()) return null;
  return ORGANIZER_CANONICAL_STATS[ownerUserId] ?? null;
}
