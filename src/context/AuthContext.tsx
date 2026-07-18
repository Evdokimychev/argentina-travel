"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import type { AuthIntent, FavoriteAuthStep } from "@/types/auth";
import type { SessionUser, AccountRole } from "@/types/user";
import type { FavoriteTourInput } from "@/hooks/useFavoriteTour";
import { splitFullName } from "@/lib/full-name";
import { getAuthProvider } from "@/lib/auth-provider";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { profileToSessionUser } from "@/lib/profile-mapper";
import { attachGuestBookingsAfterLogin } from "@/lib/booking-attach-client";
import {
  flushFavoriteSyncQueue,
  syncFavoritesOnLogin,
  toggleFavoriteWithServerSync,
} from "@/lib/favorites-store";
import { syncBlogReadingHistoryWithRemote } from "@/lib/blog-reading-history-sync";
import { setSentryUserContext } from "@/lib/monitoring/sentry";
import { canAccessOrganizerPanel } from "@/lib/permissions";
import AuthQueryHandler from "@/components/auth/AuthQueryHandler";
import FavoriteAuthSuccessListener from "@/components/auth/FavoriteAuthSuccessListener";

function AuthModalLoadingFallback() {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-loading-title"
      aria-describedby="auth-loading-description"
      className="fixed inset-0 z-modal flex items-center justify-center bg-charcoal/35 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-3xl border border-border-subtle bg-surface-elevated p-6 shadow-elevated">
        <p id="auth-loading-title" className="font-display text-lg font-semibold text-foreground">
          Открываем вход…
        </p>
        <p id="auth-loading-description" className="mt-2 text-sm text-slate">
          Подготавливаем защищённую форму. Это займёт несколько секунд.
        </p>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-sky" />
        </div>
      </div>
    </div>
  );
}

const AuthModal = dynamic(() => import("@/components/auth/AuthModal"), {
  ssr: false,
  loading: AuthModalLoadingFallback,
});
const FavoriteAuthPromptModal = dynamic(
  () => import("@/components/auth/FavoriteAuthPromptModal"),
  { ssr: false },
);

export const FAVORITE_SAVED_AFTER_AUTH_EVENT = "favorite-saved-after-auth";

interface AuthContextValue {
  user: SessionUser | null;
  isAuthenticated: boolean;
  /** True after the initial session/profile hydration attempt finishes. */
  authHydrated: boolean;
  authOpen: boolean;
  authIntent: AuthIntent;
  favoriteAuthStep: FavoriteAuthStep;
  favoritePromptOpen: boolean;
  openAuth: (intent?: AuthIntent, step?: "sign-in" | "forgot-password") => void;
  authInitialStep: "sign-in" | "forgot-password";
  closeAuth: () => void;
  openFavoritePrompt: (tour: FavoriteTourInput) => void;
  closeFavoritePrompt: () => void;
  openAuthFromFavorite: (step: FavoriteAuthStep) => void;
  loginByPhone: (
    phone: string,
    role: AccountRole,
    password?: string
  ) => Promise<
    | { ok: true; user: SessionUser }
    | { ok: false; error: string; notFound?: boolean; roleNotConnected?: boolean }
  >;
  loginByEmail: (
    email: string,
    password: string,
    role: AccountRole
  ) => Promise<
    | { ok: true; user: SessionUser }
    | { ok: false; error: string; roleNotConnected?: boolean; code?: string }
  >;
  loginForOrganizerUpgrade: (
    email: string,
    password: string
  ) => Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }>;
  register: (input: {
    role: AccountRole;
    fullName: string;
    phone: string;
    email: string;
    password?: string;
  }) => Promise<
    | { ok: true; user: SessionUser }
    | { ok: false; confirmationRequired: true; email: string }
    | { ok: false; error: string; duplicatePhone?: boolean; duplicateEmail?: boolean }
  >;
  addOrganizerRole: () => Promise<{ ok: true } | { ok: false; error: string }>;
  requestPasswordReset: (
    email: string
  ) => Promise<
    | { ok: true; message: string }
    | { ok: false; error: string; code?: string; retryAfter?: number }
  >;
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

export function hasBrowserSupabaseAuthCookie(cookieHeader: string): boolean {
  return cookieHeader
    .split(";")
    .map((part) => part.trim().split("=", 1)[0] ?? "")
    .some((name) => name.startsWith("sb-") && name.includes("-auth-token"));
}

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
  const [authInitialStep, setAuthInitialStep] = useState<"sign-in" | "forgot-password">("sign-in");
  const [favoriteAuthStep, setFavoriteAuthStep] = useState<FavoriteAuthStep>("sign-in");
  const [favoritePromptOpen, setFavoritePromptOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const pendingFavoriteRef = useRef<FavoriteTourInput | null>(null);
  const favoriteFlowRef = useRef(false);

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

    // Anonymous public visitors do not need the Supabase/WebAuthn bundle. The
    // provider is still loaded on demand by every login/register action.
    if (!hasBrowserSupabaseAuthCookie(document.cookie)) {
      setUser(null);
      setHydrated(true);
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    void import("@/lib/supabase/client").then(({ createSupabaseBrowserClient }) => {
      if (cancelled) return;
      const supabase = createSupabaseBrowserClient();

      async function loadProfile(userId: string) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        if (cancelled) return;
        setUser(profile ? profileToSessionUser(profile) : null);
        setHydrated(true);
      }

      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (cancelled) return;
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
        if (cancelled) return;
        if (session?.user) {
          void loadProfile(session.user.id);
        } else {
          setUser(null);
          setHydrated(true);
        }
      });
      unsubscribe = () => subscription.unsubscribe();
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [refreshSessionUser]);

  useEffect(() => {
    if (!authOpen && !favoritePromptOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [authOpen, favoritePromptOpen]);

  useEffect(() => {
    if (!user) {
      setSentryUserContext(null);
      return;
    }

    setSentryUserContext({
      id: user.id,
      email: user.email,
      role: user.role,
      roles: user.roles,
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    void syncFavoritesOnLogin(user, user.id);
    void syncBlogReadingHistoryWithRemote();

    const onOnline = () => {
      void flushFavoriteSyncQueue(user, user.id);
    };

    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [user]);

  const openAuth = useCallback((intent: AuthIntent = "default", step: "sign-in" | "forgot-password" = "sign-in") => {
    setAuthIntent(intent);
    setAuthInitialStep(step);
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setAuthOpen(false);
    setAuthIntent("default");
    setAuthInitialStep("sign-in");
    pendingFavoriteRef.current = null;
    favoriteFlowRef.current = false;
  }, []);

  const openFavoritePrompt = useCallback((tour: FavoriteTourInput) => {
    pendingFavoriteRef.current = tour;
    setFavoritePromptOpen(true);
  }, []);

  const closeFavoritePrompt = useCallback(() => {
    setFavoritePromptOpen(false);
    pendingFavoriteRef.current = null;
    favoriteFlowRef.current = false;
  }, []);

  const openAuthFromFavorite = useCallback((step: FavoriteAuthStep) => {
    setFavoritePromptOpen(false);
    setFavoriteAuthStep(step);
    favoriteFlowRef.current = true;
    setAuthIntent("favorite");
    setAuthOpen(true);
  }, []);

  const afterAuthSuccess = useCallback(async (nextUser: SessionUser) => {
    setUser(nextUser);
    if (nextUser.email) {
      attachGuestBookingsAfterLogin();
    }

    if (favoriteFlowRef.current && pendingFavoriteRef.current) {
      const pending = pendingFavoriteRef.current;
      const result = await toggleFavoriteWithServerSync(nextUser, nextUser.id, pending);
      pendingFavoriteRef.current = null;
      favoriteFlowRef.current = false;
      setAuthIntent("default");

      if (!("error" in result) && result.favorited) {
        window.dispatchEvent(new CustomEvent(FAVORITE_SAVED_AFTER_AUTH_EVENT));
      }
    }
  }, []);

  const loginByPhone = useCallback(async (phone: string, role: AccountRole, password?: string) => {
    const result = await getAuthProvider().loginWithPhone(phone, role, password);
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
    return { ok: true as const, user: result.user };
  }, [afterAuthSuccess]);

  const loginByEmail = useCallback(async (email: string, password: string, role: AccountRole) => {
    const result = await getAuthProvider().loginWithEmail(email, password, role);
    if ("error" in result) {
      if (
        result.code === "ROLE_NOT_CONNECTED" ||
        result.error === "ROLE_NOT_CONNECTED"
      ) {
        return {
          ok: false as const,
          error: "ROLE_NOT_CONNECTED",
          roleNotConnected: true,
        };
      }
      return { ok: false as const, error: result.error, code: result.code };
    }

    await afterAuthSuccess(result.user);
    return { ok: true as const, user: result.user };
  }, [afterAuthSuccess]);

  const loginForOrganizerUpgrade = useCallback(async (email: string, password: string) => {
    const provider = getAuthProvider();
    const result = await provider.loginTouristForOrganizerUpgrade(email, password);
    if ("error" in result) {
      return { ok: false as const, error: result.error };
    }

    const connected = await provider.addOrganizerRole(result.user.id);
    if ("error" in connected) {
      setUser(result.user);
      return {
        ok: false as const,
        error: connected.error ?? "Не удалось подключить роль организатора",
      };
    }

    setUser(connected.user);
    await afterAuthSuccess(connected.user);
    return { ok: true as const, user: connected.user };
  }, [afterAuthSuccess]);

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

      if ("confirmationRequired" in result) {
        return {
          ok: false as const,
          confirmationRequired: true as const,
          email: result.email,
        };
      }

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
      return { ok: true as const, user: result.user };
    },
    [afterAuthSuccess]
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    const result = await getAuthProvider().requestPasswordReset(email);
    if ("error" in result) {
      return {
        ok: false as const,
        error: result.error,
        code: result.code,
        retryAfter: result.retryAfter,
      };
    }
    return { ok: true as const, message: result.message };
  }, []);

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
    setFavoritePromptOpen(false);
    pendingFavoriteRef.current = null;
    favoriteFlowRef.current = false;
  }, []);

  const value = useMemo(
    () => ({
      user: hydrated ? user : null,
      isAuthenticated: hydrated ? user != null : false,
      authHydrated: hydrated,
      authOpen,
      authIntent,
      authInitialStep,
      favoriteAuthStep,
      favoritePromptOpen,
      openAuth,
      closeAuth,
      openFavoritePrompt,
      closeFavoritePrompt,
      openAuthFromFavorite,
      loginByPhone,
      loginByEmail,
      loginForOrganizerUpgrade,
      register,
      addOrganizerRole: connectOrganizerRole,
      requestPasswordReset,
      updateProfile,
      updateAvatar,
      logout,
    }),
    [
      authIntent,
      authInitialStep,
      authOpen,
      closeAuth,
      closeFavoritePrompt,
      connectOrganizerRole,
      favoriteAuthStep,
      favoritePromptOpen,
      hydrated,
      loginByEmail,
      loginByPhone,
      loginForOrganizerUpgrade,
      logout,
      openAuth,
      openAuthFromFavorite,
      openFavoritePrompt,
      register,
      requestPasswordReset,
      updateAvatar,
      updateProfile,
      user,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthQueryHandler />
      {favoritePromptOpen ? <FavoriteAuthPromptModal /> : null}
      <FavoriteAuthSuccessListener />
      {authOpen ? <AuthModal /> : null}
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
