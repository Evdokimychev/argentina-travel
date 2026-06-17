import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { AuthProvider, AuthResult, AuthErrorCode } from "@/lib/auth-provider";
import { DEMO_PASSWORD } from "@/lib/auth-store";
import { profileToSessionUser } from "@/lib/profile-mapper";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizePhone } from "@/lib/auth-store";
import type { AccountRole, SessionUser } from "@/types/user";
import { normalizeAccountRoles, userHasAccountRole } from "@/types/user";

type BrowserClient = SupabaseClient<Database>;

let cachedClient: BrowserClient | null = null;

function getClient(): BrowserClient {
  if (!cachedClient) {
    cachedClient = createSupabaseBrowserClient();
  }
  return cachedClient;
}

async function fetchProfile(userId: string) {
  const { data, error } = await getClient()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

async function sessionFromAuthUser(
  userId: string,
  activeRole?: AccountRole
): Promise<SessionUser | null> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const profile = await fetchProfile(userId);
    if (profile) {
      return profileToSessionUser(profile, activeRole);
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return null;
}

function rejectLogin(error: string, code?: AuthErrorCode): AuthResult {
  return { error, code };
}

async function refreshClientSession() {
  await getClient().auth.getSession();
}

async function loginByPhoneApi(
  phone: string,
  role: AccountRole,
  password?: string
): Promise<AuthResult> {
  const response = await fetch("/api/auth/login-by-phone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ phone, role, password }),
  });

  const body = (await response.json()) as {
    ok?: boolean;
    error?: string;
    code?: AuthErrorCode;
  };

  if (!response.ok) {
    return rejectLogin(body.error ?? "Ошибка входа", body.code);
  }

  await refreshClientSession();

  const { data: sessionData, error } = await getClient().auth.getSession();
  if (error || !sessionData.session?.user) {
    return { error: "Не удалось получить сессию. Попробуйте войти по email и паролю." };
  }

  const user = await sessionFromAuthUser(sessionData.session.user.id, role);
  if (!user) return { error: "Профиль не найден" };
  return { user };
}

async function loginByEmailApi(
  email: string,
  password: string,
  role: AccountRole
): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const response = await fetch("/api/auth/login-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ email: normalizedEmail, password, role }),
  });

  const body = (await response.json()) as {
    ok?: boolean;
    error?: string;
    code?: AuthErrorCode;
    user?: SessionUser;
  };

  if (!response.ok) {
    return rejectLogin(body.error ?? "Ошибка входа", body.code);
  }

  await refreshClientSession();

  if (body.user) {
    return { user: body.user };
  }

  const { data: sessionData } = await getClient().auth.getSession();
  if (!sessionData.session?.user) {
    return { error: "Не удалось получить сессию" };
  }

  const user = await sessionFromAuthUser(sessionData.session.user.id, role);
  if (!user) return { error: "Профиль не найден" };
  return { user };
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
    userId?: string;
  };

  if (!response.ok) {
    return { error: body.error ?? "Не удалось зарегистрироваться", code: body.code };
  }

  const signInResult = await getClient().auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (signInResult.error || !signInResult.data.user) {
    const fallback = await loginByEmailApi(normalizedEmail, password, input.role);
    if ("user" in fallback) {
      return fallback;
    }
    return {
      error:
        "Аккаунт создан, но автоматический вход не удался. Войдите по email и паролю.",
    };
  }

  const user = await sessionFromAuthUser(signInResult.data.user.id, input.role);
  if (!user) return { error: "Профиль не найден" };
  return { user };
}

export const supabaseAuthProvider: AuthProvider = {
  async getSessionUser() {
    const { data } = await getClient().auth.getSession();
    if (!data.session?.user) return null;
    return sessionFromAuthUser(data.session.user.id);
  },

  async loginWithPhone(phone, role, password?) {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      return { error: "Введите корректный номер телефона" };
    }
    return loginByPhoneApi(normalized, role, password);
  },

  async loginWithEmail(email, password, role) {
    if (!email.trim() || !password.trim()) {
      return rejectLogin("Неверный email или пароль", "INVALID_CREDENTIALS");
    }
    return loginByEmailApi(email, password, role);
  },

  async loginTouristForOrganizerUpgrade(email, password) {
    const result = await loginByEmailApi(email, password, "tourist");
    if ("error" in result) return result;
    return { user: { ...result.user, role: "tourist" } };
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
      const user = profileToSessionUser(profile, "organizer");
      return { user };
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
