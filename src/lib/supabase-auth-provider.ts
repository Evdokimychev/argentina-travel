import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { AuthProvider, AuthResult, AuthErrorCode } from "@/lib/auth-provider";
import { DEMO_PASSWORD } from "@/lib/auth-store";
import { profileToSessionUser, sessionUserToProfileUpdate } from "@/lib/profile-mapper";
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
  const profile = await fetchProfile(userId);
  if (!profile) return null;
  return profileToSessionUser(profile, activeRole);
}

function rejectLogin(error: string, code?: AuthErrorCode): AuthResult {
  return { error, code };
}

async function loginByPhoneApi(phone: string, role: AccountRole): Promise<AuthResult> {
  const response = await fetch("/api/auth/login-by-phone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, role }),
  });

  const body = (await response.json()) as {
    ok?: boolean;
    error?: string;
    code?: AuthErrorCode;
  };

  if (!response.ok) {
    return rejectLogin(body.error ?? "Ошибка входа", body.code);
  }

  const { data: sessionData, error } = await getClient().auth.getSession();
  if (error || !sessionData.session?.user) {
    return { error: "Не удалось получить сессию" };
  }

  const user = await sessionFromAuthUser(sessionData.session.user.id, role);
  if (!user) return { error: "Профиль не найден" };
  return { user };
}

export const supabaseAuthProvider: AuthProvider = {
  async getSessionUser() {
    const { data } = await getClient().auth.getSession();
    if (!data.session?.user) return null;
    return sessionFromAuthUser(data.session.user.id);
  },

  async loginWithPhone(phone, role) {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      return { error: "Введите корректный номер телефона" };
    }
    return loginByPhoneApi(normalized, role);
  },

  async loginWithEmail(email, password, role) {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await getClient().auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data.user) {
      return rejectLogin("Неверный email или пароль", "INVALID_CREDENTIALS");
    }

    const profile = await fetchProfile(data.user.id);
    if (!profile) {
      return { error: "Профиль не найден" };
    }

    if (!userHasAccountRole({ role: profile.active_role, roles: profile.roles as AccountRole[] }, role)) {
      await getClient().auth.signOut();
      return rejectLogin(
        role === "organizer"
          ? "ROLE_NOT_CONNECTED"
          : "Эта почта зарегистрирована как автор тура.",
        role === "organizer" ? "ROLE_NOT_CONNECTED" : "WRONG_ROLE"
      );
    }

    if (role !== profile.active_role) {
      await getClient()
        .from("profiles")
        .update({ active_role: role })
        .eq("id", data.user.id);
    }

    const user = profileToSessionUser(profile, role);
    return { user };
  },

  async loginTouristForOrganizerUpgrade(email, password) {
    const result = await supabaseAuthProvider.loginWithEmail(email, password, "tourist");
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

    const password = input.password?.trim() || DEMO_PASSWORD;
    const roles: AccountRole[] =
      input.role === "organizer" ? ["tourist", "organizer"] : [input.role];

    const { data, error } = await getClient().auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: normalizedPhone,
          role: input.role,
          country: "Россия",
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        return { error: "DUPLICATE_EMAIL", code: "DUPLICATE_EMAIL" };
      }
      return { error: error.message };
    }

    if (!data.user) {
      return { error: "Не удалось создать аккаунт" };
    }

    await getClient()
      .from("profiles")
      .upsert({
        id: data.user.id,
        email: normalizedEmail,
        first_name: firstName,
        last_name: lastName,
        phone: normalizedPhone,
        roles,
        active_role: input.role,
      });

    const user = await sessionFromAuthUser(data.user.id, input.role);
    if (!user) return { error: "Профиль не найден" };
    return { user };
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
