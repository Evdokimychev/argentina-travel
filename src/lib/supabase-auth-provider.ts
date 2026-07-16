import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  AuthProvider,
  AuthResult,
  AuthErrorCode,
  RegistrationAuthResult,
} from "@/lib/auth-provider";
import { resolvePasswordInput } from "@/lib/auth-input";
import { profileToSessionUser } from "@/lib/profile-mapper";
import { setSentryUserContext } from "@/lib/monitoring/sentry";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizePhone } from "@/lib/auth-input";
import type { AccountRole, SessionUser } from "@/types/user";
import { normalizeAccountRoles, userHasAccountRole } from "@/types/user";
import type { Profile } from "@/types/database";
import {
  mapAuthClientError,
  normalizeAuthEmail,
} from "@/lib/auth-flow";

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

function mapSignInError(error: unknown): AuthResult {
  const mapped = mapAuthClientError(error);
  if (mapped === "invalid_credentials") {
    return rejectLogin("INVALID_CREDENTIALS", "INVALID_CREDENTIALS");
  }
  if (mapped === "email_not_confirmed") {
    return rejectLogin("EMAIL_NOT_CONFIRMED", "EMAIL_NOT_CONFIRMED");
  }
  if (mapped === "rate_limit") return rejectLogin("RATE_LIMITED", "RATE_LIMITED");
  if (mapped === "user_banned") return rejectLogin("USER_BANNED", "USER_BANNED");
  if (mapped === "network_error") return rejectLogin("NETWORK_ERROR", "NETWORK_ERROR");
  if (mapped === "configuration_error") {
    return rejectLogin("CONFIGURATION_ERROR", "CONFIGURATION_ERROR");
  }
  return rejectLogin("Не удалось войти. Попробуйте ещё раз.", "INVALID_CREDENTIALS");
}

async function finalizeLogin(profile: Profile, role: AccountRole): Promise<AuthResult> {
  if (profile.is_blocked) {
    await getClient().auth.signOut();
    return rejectLogin(
      "Аккаунт заблокирован. Обратитесь в поддержку через форму контактов.",
      "INVALID_CREDENTIALS"
    );
  }

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
  const normalizedEmail = normalizeAuthEmail(email);

  const { data, error } = await getClient().auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || !data.user) {
    return mapSignInError(error ?? "Invalid login credentials");
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
}): Promise<RegistrationAuthResult> {
  const normalizedEmail = normalizeAuthEmail(input.email);
  const password = resolvePasswordInput(input.password);

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
    confirmationRequired?: boolean;
  };

  if (!response.ok) {
    return { error: body.error ?? "Не удалось зарегистрироваться", code: body.code };
  }

  if (body.confirmationRequired) {
    return { confirmationRequired: true, email: normalizedEmail };
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

    const loginPassword = resolvePasswordInput(password);
    const lookupResponse = await fetch("/api/auth/sign-in-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ phone: normalized, password: loginPassword, role }),
    });
    const body = (await lookupResponse.json().catch(() => null)) as AuthResult | null;
    if (!lookupResponse.ok || !body) {
      return rejectLogin(
        body && "error" in body ? body.error : "INVALID_CREDENTIALS",
        body && "code" in body ? body.code : "INVALID_CREDENTIALS",
      );
    }
    return body;
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
    const normalizedEmail = normalizeAuthEmail(input.email);
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

    return {
      error: "Роль организатора появится после одобрения заявки. Заполните анкету на странице «Стать организатором».",
    };
  },

  async updateProfile(userId, input) {
    const { sessionUserToProfileUpdate } = await import("@/lib/profile-mapper");
    const { normalizePhone } = await import("@/lib/auth-store");
    const { resolvePhoneCountryIsoFromProfile } = await import("@/data/profile-countries");
    const normalizedPhone =
      normalizePhone(input.phone, resolvePhoneCountryIsoFromProfile(input.country)) ??
      input.phone.trim();
    const normalizedEmail = normalizeAuthEmail(input.email);

    const existing = await fetchProfile(userId);
    if (!existing) return { error: "Профиль не найден" };

    if (normalizedEmail && normalizedEmail !== (existing.email ?? "").trim().toLowerCase()) {
      const { error: emailError } = await getClient().auth.updateUser({ email: normalizedEmail });
      if (emailError) {
        const lower = emailError.message.toLowerCase();
        if (lower.includes("already") || lower.includes("registered")) {
          return { error: "Эта почта уже используется другим аккаунтом" };
        }
        return { error: emailError.message };
      }
    }

    const patch = sessionUserToProfileUpdate({ ...input, phone: normalizedPhone, email: normalizedEmail });
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
    const normalizedEmail = normalizeAuthEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return { error: "Укажите корректный email" };
    }

    const response = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email: normalizedEmail }),
    });

    const body = (await response.json().catch(() => null)) as
      | {
          ok?: boolean;
          message?: string;
          error?: { code?: string; message?: string; retryAfter?: number };
        }
      | null;
    if (!response.ok) {
      return {
        error: body?.error?.message ?? "Не удалось отправить письмо",
        code: body?.error?.code,
        retryAfter: body?.error?.retryAfter,
      };
    }

    return {
      ok: true,
      message:
        body?.message ??
        "Если этот адрес зарегистрирован, мы отправили ссылку для изменения пароля.",
    };
  },
};

export async function loadSessionUserFromSupabase(
  supabase: SupabaseClient<Database>,
  activeRole?: AccountRole
): Promise<SessionUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    setSentryUserContext(null);
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;
  const sessionUser = profileToSessionUser(profile, activeRole);
  setSentryUserContext({
    id: sessionUser.id,
    email: sessionUser.email,
    role: sessionUser.role,
    roles: sessionUser.roles,
  });
  return sessionUser;
}
