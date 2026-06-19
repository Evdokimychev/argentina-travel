/** Moderation states that allow a published tour in the public catalog. */
export const PUBLIC_TOUR_MODERATION_STATUSES = ["approved", "none"] as const;

export type PublicTourModerationStatus = (typeof PUBLIC_TOUR_MODERATION_STATUSES)[number];

export function isTourPubliclyVisible(moderationStatus: string | null | undefined): boolean {
  if (!moderationStatus || moderationStatus === "none") return true;
  return moderationStatus === "approved";
}
