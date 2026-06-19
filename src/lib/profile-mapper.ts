import type { Profile } from "@/types/database";
import { toSessionUser } from "@/lib/auth-session";
import type { AccountRole, SessionUser, User } from "@/types/user";
import { normalizeAccountRoles } from "@/types/user";
import { DEFAULT_PROFILE_COUNTRY } from "@/data/profile-countries";

export function profileToUser(profile: Profile, activeRole?: AccountRole): User {
  const roles = normalizeAccountRoles({
    role: profile.active_role,
    roles: profile.roles as AccountRole[],
  });
  const role =
    activeRole && roles.includes(activeRole)
      ? activeRole
      : roles.includes(profile.active_role as AccountRole)
        ? (profile.active_role as AccountRole)
        : roles[0];

  return {
    id: profile.id,
    role,
    roles,
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    avatar: profile.avatar_url,
    firstName: profile.first_name,
    lastName: profile.last_name,
    country: profile.country ?? DEFAULT_PROFILE_COUNTRY,
    dateOfBirth: profile.date_of_birth,
    createdAt: profile.created_at,
  };
}

export function profileToSessionUser(profile: Profile, activeRole?: AccountRole): SessionUser {
  return toSessionUser(profileToUser(profile, activeRole));
}

export function sessionUserToProfileUpdate(
  input: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    country: string;
    dateOfBirth: string | null;
  },
  activeRole?: AccountRole
): Partial<Profile> {
  return {
    first_name: input.firstName,
    last_name: input.lastName,
    phone: input.phone || null,
    email: input.email,
    country: input.country,
    date_of_birth: input.dateOfBirth,
    ...(activeRole ? { active_role: activeRole } : {}),
  };
}
