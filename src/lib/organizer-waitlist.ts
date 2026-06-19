import { getOrganizerCatalogSlugs } from "@/lib/organizer-bookings";
import {
  getOrganizerWaitlistEntries,
  getOrganizerWaitlistStats,
} from "@/lib/waitlist-store";

export function getOrganizerWaitlistForCabinet(userId: string) {
  return getOrganizerWaitlistEntries(getOrganizerCatalogSlugs(userId));
}

export function getOrganizerCabinetWaitlistStats(userId: string) {
  return getOrganizerWaitlistStats(getOrganizerCatalogSlugs(userId));
}
