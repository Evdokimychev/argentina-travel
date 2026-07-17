import type { WaitlistEntry } from "@/types/waitlist";

/** Production provider: local waitlist fixtures never enter the production graph. */
export function getDemoWaitlistSeeds(): WaitlistEntry[] {
  return [];
}
