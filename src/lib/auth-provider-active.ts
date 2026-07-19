import type { AuthProvider } from "@/lib/auth-provider";

let providerPromise: Promise<AuthProvider> | null = null;

function loadActiveAuthProvider(): Promise<AuthProvider> {
  if (!providerPromise) {
    providerPromise = import("@/lib/supabase-auth-provider").then(
      ({ supabaseAuthProvider }) => supabaseAuthProvider,
    );
  }
  return providerPromise;
}

/**
 * Keep the public shell independent from the Supabase/WebAuthn browser bundle.
 * The real provider is loaded only when a session must be restored or an auth
 * action is requested.
 */
export const activeAuthProvider: AuthProvider = {
  async getSessionUser() {
    return (await loadActiveAuthProvider()).getSessionUser();
  },
  async loginWithPhone(phone, role, password) {
    return (await loadActiveAuthProvider()).loginWithPhone(phone, role, password);
  },
  async loginWithEmail(email, password, role) {
    return (await loadActiveAuthProvider()).loginWithEmail(email, password, role);
  },
  async loginTouristForOrganizerUpgrade(email, password) {
    return (await loadActiveAuthProvider()).loginTouristForOrganizerUpgrade(email, password);
  },
  async register(input) {
    return (await loadActiveAuthProvider()).register(input);
  },
  async addOrganizerRole(userId) {
    return (await loadActiveAuthProvider()).addOrganizerRole(userId);
  },
  async updateProfile(userId, input) {
    return (await loadActiveAuthProvider()).updateProfile(userId, input);
  },
  async updateAvatar(userId, avatarUrl) {
    return (await loadActiveAuthProvider()).updateAvatar(userId, avatarUrl);
  },
  async requestPasswordReset(email) {
    return (await loadActiveAuthProvider()).requestPasswordReset(email);
  },
  async logout() {
    await (await loadActiveAuthProvider()).logout();
  },
};
