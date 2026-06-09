export type AuthUserRole = "tourist" | "organizer";

export type AuthIntent = "default" | "organizer";

export interface AuthUser {
  id: string;
  /** Активная роль в текущей сессии */
  role: AuthUserRole;
  /** Все роли, доступные аккаунту */
  roles: AuthUserRole[];
  fullName: string;
  phone: string;
  email: string;
  avatarUrl: string | null;
  country: string;
  dateOfBirth: string | null;
}

export interface StoredAuthUser extends Omit<AuthUser, "roles"> {
  roles?: AuthUserRole[];
  password?: string;
}

export function normalizeUserRoles(user: Pick<StoredAuthUser, "role" | "roles">): AuthUserRole[] {
  if (user.roles?.length) return [...new Set(user.roles)];
  return [user.role];
}

export function userHasRole(
  user: Pick<StoredAuthUser, "role" | "roles">,
  role: AuthUserRole
): boolean {
  return normalizeUserRoles(user).includes(role);
}
