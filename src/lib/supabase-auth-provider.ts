import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { AuthProvider, AuthResult, AuthErrorCode } from "@/lib/auth-provider";
import { DEMO_PASSWORD } from "@/lib/auth-store";
import { profileToSessionUser } from "@/lib/profile-mapper";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizePhone } from "@/lib/auth-store";
import type { AccountRole, SessionUser } from "@/types/user";
import { normalizeAccountRoles, userHasAccountRole } from "@/types/user";
import type { Profile } from "@/types/database";

type BrowserClient = SupabaseClient<Database>;

let cachedClient: BrowserClient | null = null;

function getClient(): BrowserClient {
  if (!cachedClient) {
    cachedClient = createSupabaseBrowserClient();
  }
  return cachedClient;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getClient()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

async function ensureProfileForSession(userId: string): Promise<Profile | null> {
  const existing = await fetchProfile(userId);
  if (existing) return existing;

  const response = await fetch("/api/auth/ensure-profile", {
    method: "POST",
    credentials: "same-origin",
  });

  if (!response.ok) return null;

  const body = (await response.json()) as { user?: SessionUser };
  if (!body.user) return null;

  return fetchProfile(userId);
}

function rejectLogin(error: string, code?: AuthErrorCode): AuthResult {
  return { error, code };
}

function mapSignInError(message: string): AuthResult {
  const lower = message.toLowerCase();
  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid email or password") ||
    lower.includes("invalid credentials")
  ) {
    return rejectLogin("Неверный email или пароль", "INVALID_CREDENTIALS");
  }
  if (lower.includes("email not confirmed")) {
    return rejectLogin(
      "Подтвердите email — проверьте почту или восстановите пароль.",
      "INVALID_CREDENTIALS"
    );
  }
  return rejectLogin(message, "INVALID_CREDENTIALS");
}

async function finalizeLogin(profile: Profile, role: AccountRole): Promise<AuthResult> {
  const account = {
    role: profile.active_role as AccountRole,
    roles: profile.roles as AccountRole[],
  };

  if (!userHasAccountRole(account, role)) {
    if (role === "organizer") {
      return rejectLogin("ROLE_NOT_CONNECTED", "ROLE_NOT_CONNECTED");
    }
    await getClient().auth.signOut();
    return rejectLogin("WRONG_ROLE", "WRONG_ROLE");
  }

  if (profile.active_role !== role) {
    const { error } = await getClient()
      .from("profiles")
      .update({ active_role: role })
      .eq("id", profile.id);

    if (error) {
      return { error: error.message };
    }
  }

  const refreshed = await fetchProfile(profile.id);
  if (!refreshed) {
    return { error: "Профиль не найден", code: "PROFILE_MISSING" };
  }

  return { user: profileToSessionUser({ ...refreshed, active_role: role }, role) };
}

/** Единый вход: клиентский signIn + профиль + роль (как при регистрации). */
async function loginWithCredentials(
  email: string,
  password: string,
  role: AccountRole
): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await getClient().auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || !data.user) {
    return mapSignInError(error?.message ?? "Неверный email или пароль");
  }

  const profile = await ensureProfileForSession(data.user.id);
  if (!profile) {
    await getClient().auth.signOut();
    return {
      error: "Профиль не найден. Напишите в поддержку — мы восстановим доступ.",
      code: "PROFILE_MISSING",
    };
  }

  return finalizeLogin(profile, role);
}

async function registerByApi(input: {
  role: AccountRole;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password?: string;
}): Promise<AuthResult> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const password = input.password?.trim() || DEMO_PASSWORD;

  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      role: input.role,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: normalizedEmail,
      password,
    }),
  });

  const body = (await response.json()) as {
    ok?: boolean;
    error?: string;
    code?: AuthErrorCode;
  };

  if (!response.ok) {
    return { error: body.error ?? "Не удалось зарегистрироваться", code: body.code };
  }

  return loginWithCredentials(normalizedEmail, password, input.role);
}

export const supabaseAuthProvider: AuthProvider = {
  async getSessionUser() {
    const { data } = await getClient().auth.getSession();
    if (!data.session?.user) return null;

    const profile = await ensureProfileForSession(data.session.user.id);
    if (!profile) return null;
    return profileToSessionUser(profile);
  },

  async loginWithPhone(phone, role, password?) {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      return { error: "Введите корректный номер телефона" };
    }

    const lookupResponse = await fetch("/api/auth/lookup-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ phone: normalized }),
    });

    if (lookupResponse.status === 404) {
      return rejectLogin("NOT_FOUND", "NOT_FOUND");
    }

    if (!lookupResponse.ok) {
      const body = (await lookupResponse.json()) as { error?: string };
      return { error: body.error ?? "Ошибка входа" };
    }

    const lookup = (await lookupResponse.json()) as { email?: string };
    if (!lookup.email) {
      return rejectLogin("NOT_FOUND", "NOT_FOUND");
    }

    const loginPassword = password?.trim() || DEMO_PASSWORD;
    const result = await loginWithCredentials(lookup.email, loginPassword, role);

    if ("error" in result && result.code === "INVALID_CREDENTIALS" && !password?.trim()) {
      return {
        error:
          "Неверный пароль. Если вы задавали свой пароль при регистрации — войдите по email или укажите пароль.",
        code: "INVALID_CREDENTIALS",
      };
    }

    return result;
  },

  async loginWithEmail(email, password, role) {
    if (!email.trim() || !password.trim()) {
      return rejectLogin("Введите email и пароль", "INVALID_CREDENTIALS");
    }
    return loginWithCredentials(email, password, role);
  },

  async loginTouristForOrganizerUpgrade(email, password) {
    const result = await loginWithCredentials(email, password, "tourist");
    if ("error" in result) return result;
    return { user: { ...result.user, role: "tourist" as const } };
  },

  async register(input) {
    const normalizedPhone = normalizePhone(input.phone);
    const normalizedEmail = input.email.trim().toLowerCase();
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();

    if (!normalizedPhone) {
      return { error: "Введите корректный номер телефона" };
    }
    if (!firstName) {
      return { error: "Укажите имя" };
    }
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return { error: "Укажите корректный email" };
    }

    return registerByApi({
      role: input.role,
      firstName,
      lastName,
      phone: normalizedPhone,
      email: normalizedEmail,
      password: input.password,
    });
  },

  async addOrganizerRole(userId) {
    const profile = await fetchProfile(userId);
    if (!profile) {
      return { error: "Пользователь не найден" };
    }

    const roles = normalizeAccountRoles({
      role: profile.active_role as AccountRole,
      roles: profile.roles as AccountRole[],
    });

    if (roles.includes("organizer")) {
      return { user: profileToSessionUser(profile, "organizer") };
    }

    const nextRoles: AccountRole[] = [...roles, "organizer"];
    const { error } = await getClient()
      .from("profiles")
      .update({ roles: nextRoles, active_role: "organizer" })
      .eq("id", userId);

    if (error) {
      return { error: error.message };
    }

    const updated = await fetchProfile(userId);
    if (!updated) return { error: "Профиль не найден" };
    return { user: profileToSessionUser(updated, "organizer") };
  },

  async updateProfile(userId, input) {
    const { sessionUserToProfileUpdate } = await import("@/lib/profile-mapper");
    const patch = sessionUserToProfileUpdate(input);
    const { error } = await getClient().from("profiles").update(patch).eq("id", userId);

    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") {
        return { error: "Этот телефон или почта уже используются" };
      }
      return { error: error.message };
    }

    const profile = await fetchProfile(userId);
    if (!profile) return { error: "Профиль не найден" };
    return { user: profileToSessionUser(profile) };
  },

  async updateAvatar(userId, avatarUrl) {
    const { error } = await getClient()
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", userId);

    if (error) return { error: error.message };

    const profile = await fetchProfile(userId);
    if (!profile) return { error: "Профиль не найден" };
    return { user: profileToSessionUser(profile) };
  },

  async logout() {
    await getClient().auth.signOut();
  },

  async requestPasswordReset(email) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return { error: "Укажите корректный email" };
    }

    const redirectTo = `${window.location.origin}/auth/callback?next=/auth/reset-password`;

    const clientResult = await getClient().auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo,
    });

    if (!clientResult.error) {
      return { ok: true };
    }

    const response = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email: normalizedEmail }),
    });

    const body = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok) {
      return { error: body.error ?? clientResult.error.message };
    }

    return { ok: true };
  },
};

export async function loadSessionUserFromSupabase(
  supabase: SupabaseClient<Database>,
  activeRole?: AccountRole
): Promise<SessionUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;
  return profileToSessionUser(profile, activeRole);
}
