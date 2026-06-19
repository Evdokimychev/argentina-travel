export type AuthUserRole = import("@/types/user").AccountRole;

export type AuthIntent = "default" | "organizer" | "favorite";

export type FavoriteAuthStep = "sign-in" | "register";

/** Session user exposed to UI — alias for backward compatibility. */
export type AuthUser = import("@/types/user").SessionUser;

export type StoredAuthUser = Omit<import("@/types/user").User, "roles"> & {
  roles?: import("@/types/user").AccountRole[];
  password?: string;
  /** Legacy field — migrated to firstName/lastName on read. */
  fullName?: string;
  /** Legacy field — migrated to avatar on read. */
  avatarUrl?: string | null;
};

export {
  normalizeAccountRoles as normalizeUserRoles,
  userHasAccountRole as userHasRole,
} from "@/types/user";

export type { SessionUser, User, AccountRole } from "@/types/user";
