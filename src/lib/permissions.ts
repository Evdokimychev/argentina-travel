import { hasAdminCapability } from "@/lib/admin/capabilities";
import type { AdminCapability } from "@/types/admin";
import type { AccountRole, SessionUser, User } from "@/types/user";
import { isGuest, normalizeAccountRoles, userHasAccountRole } from "@/types/user";

export const PERMISSION_DENIED = "Нет доступа";
export const PERMISSION_DENIED_CODE = "FORBIDDEN" as const;

type Actor = User | SessionUser | null | undefined;

function hasAnyRole(user: Actor, roles: AccountRole[]): boolean {
  if (!user) return false;
  const granted = normalizeAccountRoles(user);
  return roles.some((role) => granted.includes(role));
}

function isAdmin(user: Actor): boolean {
  return userHasAccountRole(user ?? null, "admin");
}

function isOrganizer(user: Actor): boolean {
  return userHasAccountRole(user ?? null, "organizer");
}

function isTourist(user: Actor): boolean {
  return userHasAccountRole(user ?? null, "tourist");
}

function ownsResource(user: Actor, ownerUserId: string | undefined): boolean {
  if (!user || !ownerUserId) return false;
  return user.id === ownerUserId;
}

// ——— Public / guest ———

export function canBrowseTours(_user?: Actor): boolean {
  return true;
}

// ——— Tourist actions ———

export function canBookTour(user: Actor): boolean {
  if (isGuest(user)) return false;
  return isTourist(user) || isOrganizer(user) || isAdmin(user);
}

export function canSaveFavorite(user: Actor): boolean {
  return canBookTour(user);
}

export function canLeaveReview(user: Actor): boolean {
  return canBookTour(user);
}

export function canAccessTouristCabinet(user: Actor): boolean {
  return canBookTour(user);
}

// ——— Organizer actions ———

export function canAccessOrganizerPanel(user: Actor): boolean {
  if (isGuest(user)) return false;
  return isOrganizer(user) || isAdmin(user);
}

export function canCreateTour(user: Actor): boolean {
  return canAccessOrganizerPanel(user);
}

export function canEditTour(user: Actor, ownerUserId: string | undefined): boolean {
  if (isGuest(user)) return false;
  if (isAdmin(user)) return true;
  if (!isOrganizer(user)) return false;
  return ownsResource(user, ownerUserId);
}

export function canArchiveTour(user: Actor, ownerUserId: string | undefined): boolean {
  return canEditTour(user, ownerUserId);
}

export function canDeleteTour(user: Actor, ownerUserId: string | undefined): boolean {
  return canEditTour(user, ownerUserId);
}

export function canManageBooking(
  user: Actor,
  context: {
    bookingUserId?: string;
    tourOwnerUserId?: string;
  }
): boolean {
  if (isGuest(user)) return false;
  if (isAdmin(user)) return true;

  if (isOrganizer(user) && context.tourOwnerUserId) {
    return ownsResource(user, context.tourOwnerUserId);
  }

  if (isTourist(user) && context.bookingUserId) {
    return user!.id === context.bookingUserId;
  }

  return false;
}

export function canCancelOwnBooking(user: Actor, bookingUserId: string): boolean {
  if (isGuest(user)) return false;
  return user!.id === bookingUserId;
}

// ——— Admin (architecture only) ———

export function canAccessAdminPanel(user: Actor): boolean {
  return isAdmin(user);
}

/** Client-side coarse check; granular capabilities resolved server-side via admin_staff. */
export function canUseAdminCapability(
  user: Actor,
  capability: AdminCapability,
  granted?: readonly AdminCapability[]
): boolean {
  if (!isAdmin(user)) return false;
  if (!granted?.length) return true;
  return hasAdminCapability(granted, capability);
}

export function canModerateTours(user: Actor, granted?: readonly AdminCapability[]): boolean {
  return canUseAdminCapability(user, "marketplace.moderation", granted);
}

export function canModerateReviews(user: Actor, granted?: readonly AdminCapability[]): boolean {
  return canUseAdminCapability(user, "marketplace.moderation", granted);
}

export function canManageUsers(user: Actor, granted?: readonly AdminCapability[]): boolean {
  return canUseAdminCapability(user, "users.manage", granted);
}

export function canViewAnalytics(user: Actor, granted?: readonly AdminCapability[]): boolean {
  return canUseAdminCapability(user, "analytics.view", granted);
}

export function assertPermission(
  allowed: boolean,
  message = PERMISSION_DENIED
): { ok: true } | { error: string; code: typeof PERMISSION_DENIED_CODE } {
  if (allowed) return { ok: true };
  return { error: message, code: PERMISSION_DENIED_CODE };
}
