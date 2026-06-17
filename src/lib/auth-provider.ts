import type { AuthIntent } from "@/types/auth";
import type { AccountRole, SessionUser } from "@/types/user";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { localAuthProvider } from "@/lib/auth-store";
import { supabaseAuthProvider } from "@/lib/supabase-auth-provider";

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
  getSessionUser(): SessionUser | null | Promise<SessionUser | null>;
  loginWithPhone: (
    phone: string,
    role: AccountRole,
    password?: string
  ) => AuthResult | Promise<AuthResult>;
  loginWithEmail(
    email: string,
    password: string,
    role: AccountRole
  ): AuthResult | Promise<AuthResult>;
  loginTouristForOrganizerUpgrade(
    email: string,
    password: string
  ): AuthResult | Promise<AuthResult>;
  register(input: {
    role: AccountRole;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password?: string;
  }): AuthResult | Promise<AuthResult>;
  addOrganizerRole(userId: string): AuthResult | Promise<AuthResult>;
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
  ): AuthResult | Promise<AuthResult>;
  updateAvatar(userId: string, avatarUrl: string | null): AuthResult | Promise<AuthResult>;
  logout(): void | Promise<void>;
}

/** Re-export for AuthContext modal flows — not part of storage. */
export type { AuthIntent };

export { localAuthProvider } from "@/lib/auth-store";

export function getAuthProvider(): AuthProvider {
  if (isSupabaseAuthEnabled()) {
    return supabaseAuthProvider;
  }
  return localAuthProvider;
}
