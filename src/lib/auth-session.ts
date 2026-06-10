import { joinFullName } from "@/lib/full-name";
import type { SessionUser, User } from "@/types/user";

export function toSessionUser(user: User): SessionUser {
  return {
    ...user,
    fullName: joinFullName(user.firstName, user.lastName),
    avatarUrl: user.avatar,
  };
}

export function sessionUserDisplayName(user: SessionUser): string {
  return user.fullName || joinFullName(user.firstName, user.lastName);
}
