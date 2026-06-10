/** Account roles persisted on a user record (guest is session-only). */
export type AccountRole = "tourist" | "organizer" | "admin";

/** Effective role including unauthenticated guest. */
export type UserRole = "guest" | AccountRole;

export interface User {
  id: string;
  /** Active role in the current session. */
  role: AccountRole;
  /** All roles granted to the account. */
  roles: AccountRole[];
  email: string;
  phone: string;
  avatar: string | null;
  firstName: string;
  lastName: string;
  country: string;
  dateOfBirth: string | null;
  createdAt: string;
}

/**
 * Session view returned by AuthProvider.
 * Keeps legacy UI fields without changing components.
 */
export interface SessionUser extends User {
  fullName: string;
  avatarUrl: string | null;
}

export const DEFAULT_ORGANIZER_OWNER_ID = "ivan-evdokimychev";

export function normalizeAccountRoles(
  user: Pick<User, "role"> & { roles?: AccountRole[] }
): AccountRole[] {
  if (user.roles?.length) return [...new Set(user.roles)];
  return [user.role];
}

export function userHasAccountRole(
  user: (Pick<User, "role"> & { roles?: AccountRole[] }) | null | undefined,
  role: AccountRole
): boolean {
  if (!user) return false;
  return normalizeAccountRoles(user).includes(role);
}

export function isGuest(user: User | SessionUser | null | undefined): user is null | undefined {
  return user == null;
}

export function getEffectiveRole(user: User | SessionUser | null | undefined): UserRole {
  if (!user) return "guest";
  return user.role;
}
