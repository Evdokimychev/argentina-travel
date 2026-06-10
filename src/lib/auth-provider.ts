import type { AuthIntent } from "@/types/auth";
import type { AccountRole, SessionUser } from "@/types/user";

export type AuthErrorCode =
  | "NOT_FOUND"
  | "ROLE_NOT_CONNECTED"
  | "WRONG_ROLE"
  | "INVALID_CREDENTIALS"
  | "DUPLICATE_PHONE"
  | "DUPLICATE_EMAIL";

export type AuthResult<T = SessionUser> =
  | { user: T }
  | { error: string; code?: AuthErrorCode };

export interface AuthProvider {
  getSessionUser(): SessionUser | null;
  loginWithPhone(phone: string, role: AccountRole): AuthResult;
  loginWithEmail(email: string, password: string, role: AccountRole): AuthResult;
  loginTouristForOrganizerUpgrade(email: string, password: string): AuthResult;
  register(input: {
    role: AccountRole;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password?: string;
  }): AuthResult;
  addOrganizerRole(userId: string): AuthResult;
  updateProfile(
    userId: string,
    input: {
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
      country: string;
      dateOfBirth: string | null;
    }
  ): AuthResult;
  updateAvatar(userId: string, avatarUrl: string | null): AuthResult;
  logout(): void;
}

/** Re-export for AuthContext modal flows — not part of storage. */
export type { AuthIntent };

export { localAuthProvider } from "@/lib/auth-store";
