import {
  canAccessOrganizerPanel,
  canAccessTouristCabinet,
} from "@/lib/permissions";
import type { SessionUser } from "@/types/user";

export type AuthRouteZone = "profile" | "organizer";

export function canAccessRouteZone(user: SessionUser | null, zone: AuthRouteZone): boolean {
  switch (zone) {
    case "profile":
      return canAccessTouristCabinet(user);
    case "organizer":
      return canAccessOrganizerPanel(user);
    default:
      return false;
  }
}
