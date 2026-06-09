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
import type { AuthIntent, AuthUser, AuthUserRole } from "@/types/auth";
import { userHasRole } from "@/types/auth";
import {
  addOrganizerRole,
  loginTouristForOrganizerUpgrade,
  loginWithEmail,
  loginWithPhone,
  logoutUser,
  readSessionUser,
  registerUser,
  updateUserAvatar,
  updateUserProfile,
} from "@/lib/auth-store";
import AuthModal from "@/components/auth/AuthModal";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  authOpen: boolean;
  authIntent: AuthIntent;
  openAuth: (intent?: AuthIntent) => void;
  closeAuth: () => void;
  loginByPhone: (
    phone: string,
    role: AuthUserRole
  ) => Promise<
    | { ok: true }
    | { ok: false; error: string; notFound?: boolean; roleNotConnected?: boolean }
  >;
  loginByEmail: (
    email: string,
    password: string,
    role: AuthUserRole
  ) => Promise<
    | { ok: true }
    | { ok: false; error: string; roleNotConnected?: boolean }
  >;
  loginForOrganizerUpgrade: (
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  register: (input: {
    role: AuthUserRole;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState<AuthIntent>("default");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(readSessionUser());
    setHydrated(true);
  }, []);

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

  const loginByPhone = useCallback(async (phone: string, role: AuthUserRole) => {
    const result = loginWithPhone(phone, role);
    if ("error" in result) {
      if (result.code === "NOT_FOUND") {
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

    setUser(result.user);
    return { ok: true as const };
  }, []);

  const loginByEmail = useCallback(async (email: string, password: string, role: AuthUserRole) => {
    const result = loginWithEmail(email, password, role);
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

    setUser(result.user);
    return { ok: true as const };
  }, []);

  const loginForOrganizerUpgrade = useCallback(async (email: string, password: string) => {
    const result = loginTouristForOrganizerUpgrade(email, password);
    if ("error" in result) {
      return { ok: false as const, error: result.error };
    }

    setUser(result.user);
    return { ok: true as const };
  }, []);

  const register = useCallback(
    async (input: {
      role: AuthUserRole;
      fullName: string;
      phone: string;
      email: string;
      password?: string;
    }) => {
      const result = registerUser(input);
      if ("error" in result) {
        if (result.error === "DUPLICATE_PHONE") {
          return {
            ok: false as const,
            error: "Пользователь с таким телефоном уже зарегистрирован",
            duplicatePhone: true,
          };
        }
        if (result.error === "DUPLICATE_EMAIL") {
          return {
            ok: false as const,
            error: "Пользователь с такой почтой уже зарегистрирован",
            duplicateEmail: true,
          };
        }
        return { ok: false as const, error: result.error };
      }

      setUser(result.user);
      return { ok: true as const };
    },
    []
  );

  const connectOrganizerRole = useCallback(async () => {
    if (!user) {
      return { ok: false as const, error: "Войдите в аккаунт" };
    }

    const result = addOrganizerRole(user.id);
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

      const result = updateUserProfile(user.id, input);
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

      const result = updateUserAvatar(user.id, avatarUrl);
      if ("error" in result) {
        return { ok: false as const, error: result.error };
      }

      setUser(result.user);
      return { ok: true as const };
    },
    [user]
  );

  const logout = useCallback(() => {
    logoutUser();
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

export function useHasOrganizerRole(user: AuthUser | null): boolean {
  return user != null && userHasRole(user, "organizer");
}
