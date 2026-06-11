"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthIntent } from "@/types/auth";
import type { AccountRole, SessionUser } from "@/types/user";
import { splitFullName } from "@/lib/full-name";
import { getAuthProvider } from "@/lib/auth-provider";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { profileToSessionUser } from "@/lib/profile-mapper";
import { attachGuestBookingsToUser } from "@/lib/bookings-store";
import { canAccessOrganizerPanel } from "@/lib/permissions";
import AuthModal from "@/components/auth/AuthModal";
import AuthQueryHandler from "@/components/auth/AuthQueryHandler";

interface AuthContextValue {
  user: SessionUser | null;
  isAuthenticated: boolean;
  authOpen: boolean;
  authIntent: AuthIntent;
  openAuth: (intent?: AuthIntent) => void;
  closeAuth: () => void;
  loginByPhone: (
    phone: string,
    role: AccountRole
  ) => Promise<
    | { ok: true }
    | { ok: false; error: string; notFound?: boolean; roleNotConnected?: boolean }
  >;
  loginByEmail: (
    email: string,
    password: string,
    role: AccountRole
  ) => Promise<{ ok: true } | { ok: false; error: string; roleNotConnected?: boolean }>;
  loginForOrganizerUpgrade: (
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  register: (input: {
    role: AccountRole;
    fullName: string;
    phone: string;
    email: string;
    password?: string;
  }) => Promise<
    | { ok: true }
    | { ok: false; error: string; duplicatePhone?: boolean; duplicateEmail?: boolean }
  >;
  addOrganizerRole: () => Promise<{ ok: true } | { ok: false; error: string }>;
  updateProfile: (input: {
    fullName: string;
    phone: string;
    email: string;
    country: string;
    dateOfBirth: string | null;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  updateAvatar: (avatarUrl: string | null) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function resolveProviderUser(activeRole?: AccountRole): Promise<SessionUser | null> {
  const provider = getAuthProvider();
  const user = await provider.getSessionUser();
  if (!user || !activeRole || user.role === activeRole) return user;
  return { ...user, role: activeRole };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState<AuthIntent>("default");
  const [hydrated, setHydrated] = useState(false);

  const refreshSessionUser = useCallback(async (activeRole?: AccountRole) => {
    const next = await resolveProviderUser(activeRole);
    setUser(next);
    return next;
  }, []);

  useEffect(() => {
    if (!isSupabaseAuthEnabled()) {
      void refreshSessionUser().finally(() => setHydrated(true));
      return;
    }

    const supabase = createSupabaseBrowserClient();

    async function loadProfile(userId: string) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (profile) {
        setUser(profileToSessionUser(profile));
      } else {
        setUser(null);
      }
      setHydrated(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void loadProfile(session.user.id);
      } else {
        setUser(null);
        setHydrated(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void loadProfile(session.user.id);
      } else {
        setUser(null);
        setHydrated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshSessionUser]);

  useEffect(() => {
    if (!authOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [authOpen]);

  const openAuth = useCallback((intent: AuthIntent = "default") => {
    setAuthIntent(intent);
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setAuthOpen(false);
    setAuthIntent("default");
  }, []);

  const afterAuthSuccess = useCallback(async (nextUser: SessionUser) => {
    setUser(nextUser);
    if (nextUser.email) {
      attachGuestBookingsToUser(nextUser.id, nextUser.email);
    }
  }, []);

  const loginByPhone = useCallback(async (phone: string, role: AccountRole) => {
    const result = await getAuthProvider().loginWithPhone(phone, role);
    if ("error" in result) {
      if (result.code === "NOT_FOUND" || result.error === "NOT_FOUND") {
        return { ok: false as const, error: "NOT_FOUND", notFound: true };
      }
      if (result.code === "ROLE_NOT_CONNECTED") {
        return {
          ok: false as const,
          error: "Аккаунт найден, но роль организатора не подключена.",
          roleNotConnected: true,
        };
      }
      return { ok: false as const, error: result.error };
    }

    await afterAuthSuccess(result.user);
    return { ok: true as const };
  }, [afterAuthSuccess]);

  const loginByEmail = useCallback(async (email: string, password: string, role: AccountRole) => {
    const result = await getAuthProvider().loginWithEmail(email, password, role);
    if ("error" in result) {
      if (result.code === "ROLE_NOT_CONNECTED") {
        return {
          ok: false as const,
          error: "Аккаунт найден, но роль организатора не подключена.",
          roleNotConnected: true,
        };
      }
      return { ok: false as const, error: result.error };
    }

    await afterAuthSuccess(result.user);
    return { ok: true as const };
  }, [afterAuthSuccess]);

  const loginForOrganizerUpgrade = useCallback(async (email: string, password: string) => {
    const result = await getAuthProvider().loginTouristForOrganizerUpgrade(email, password);
    if ("error" in result) {
      return { ok: false as const, error: result.error };
    }

    setUser(result.user);
    return { ok: true as const };
  }, []);

  const register = useCallback(
    async (input: {
      role: AccountRole;
      fullName: string;
      phone: string;
      email: string;
      password?: string;
    }) => {
      const { firstName, lastName } = splitFullName(input.fullName);
      const result = await getAuthProvider().register({
        role: input.role,
        firstName,
        lastName,
        phone: input.phone,
        email: input.email,
        password: input.password,
      });

      if ("error" in result) {
        if (result.error === "DUPLICATE_PHONE" || result.code === "DUPLICATE_PHONE") {
          return {
            ok: false as const,
            error: "Пользователь с таким телефоном уже зарегистрирован",
            duplicatePhone: true,
          };
        }
        if (result.error === "DUPLICATE_EMAIL" || result.code === "DUPLICATE_EMAIL") {
          return {
            ok: false as const,
            error: "Пользователь с такой почтой уже зарегистрирован",
            duplicateEmail: true,
          };
        }
        return { ok: false as const, error: result.error };
      }

      await afterAuthSuccess(result.user);
      return { ok: true as const };
    },
    [afterAuthSuccess]
  );

  const connectOrganizerRole = useCallback(async () => {
    if (!user) {
      return { ok: false as const, error: "Войдите в аккаунт" };
    }

    const result = await getAuthProvider().addOrganizerRole(user.id);
    if ("error" in result) {
      return { ok: false as const, error: result.error };
    }

    setUser(result.user);
    return { ok: true as const };
  }, [user]);

  const updateProfile = useCallback(
    async (input: {
      fullName: string;
      phone: string;
      email: string;
      country: string;
      dateOfBirth: string | null;
    }) => {
      if (!user) {
        return { ok: false as const, error: "Войдите в аккаунт" };
      }

      const { firstName, lastName } = splitFullName(input.fullName);
      const result = await getAuthProvider().updateProfile(user.id, {
        firstName,
        lastName,
        phone: input.phone,
        email: input.email,
        country: input.country,
        dateOfBirth: input.dateOfBirth,
      });

      if ("error" in result) {
        return { ok: false as const, error: result.error };
      }

      setUser(result.user);
      return { ok: true as const };
    },
    [user]
  );

  const updateAvatar = useCallback(
    async (avatarUrl: string | null) => {
      if (!user) {
        return { ok: false as const, error: "Войдите в аккаунт" };
      }

      const result = await getAuthProvider().updateAvatar(user.id, avatarUrl);
      if ("error" in result) {
        return { ok: false as const, error: result.error };
      }

      setUser(result.user);
      return { ok: true as const };
    },
    [user]
  );

  const logout = useCallback(() => {
    void getAuthProvider().logout();
    setUser(null);
    setAuthOpen(false);
    setAuthIntent("default");
  }, []);

  const value = useMemo(
    () => ({
      user: hydrated ? user : null,
      isAuthenticated: hydrated ? user != null : false,
      authOpen,
      authIntent,
      openAuth,
      closeAuth,
      loginByPhone,
      loginByEmail,
      loginForOrganizerUpgrade,
      register,
      addOrganizerRole: connectOrganizerRole,
      updateProfile,
      updateAvatar,
      logout,
    }),
    [
      authIntent,
      authOpen,
      closeAuth,
      connectOrganizerRole,
      hydrated,
      loginByEmail,
      loginByPhone,
      loginForOrganizerUpgrade,
      logout,
      openAuth,
      register,
      updateAvatar,
      updateProfile,
      user,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthQueryHandler />
      <AuthModal />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

/** @deprecated Prefer canAccessOrganizerPanel from @/lib/permissions */
export function useHasOrganizerRole(user: SessionUser | null): boolean {
  return canAccessOrganizerPanel(user);
}

export function useCanAccessOrganizerPanel(user: SessionUser | null): boolean {
  return canAccessOrganizerPanel(user);
}

export type { SessionUser as AuthUser };
