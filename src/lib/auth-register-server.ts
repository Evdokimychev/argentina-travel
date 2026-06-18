import { normalizePhone, resolvePasswordInput } from "@/lib/auth-store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { profileToSessionUser } from "@/lib/profile-mapper";
import type { AccountRole } from "@/types/user";

export type RegisterInput = {
  role: AccountRole;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password?: string;
};

export type RegisterErrorCode = "DUPLICATE_PHONE" | "DUPLICATE_EMAIL" | "VALIDATION";

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; error: string; code?: RegisterErrorCode };

function validationError(message: string): RegisterResult {
  return { ok: false, error: message, code: "VALIDATION" };
}

export async function registerSupabaseUser(input: RegisterInput): Promise<RegisterResult> {
  const normalizedPhone = normalizePhone(input.phone);
  const normalizedEmail = input.email.trim().toLowerCase();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const password = resolvePasswordInput(input.password);

  if (!normalizedPhone) {
    return validationError("Введите корректный номер телефона");
  }
  if (!firstName) {
    return validationError("Укажите имя");
  }
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return validationError("Укажите корректный email");
  }
  if (password.length < 6) {
    return validationError("Пароль должен содержать не менее 6 символов");
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return {
      ok: false,
      error: "На сервере не настроен SUPABASE_SERVICE_ROLE_KEY. Добавьте ключ в .env.local и перезапустите dev-сервер.",
    };
  }

  const admin = createSupabaseAdminClient();

  const { data: phoneMatch } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", normalizedPhone)
    .maybeSingle();

  if (phoneMatch) {
    return { ok: false, error: "DUPLICATE_PHONE", code: "DUPLICATE_PHONE" };
  }

  const { data: emailMatch } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (emailMatch) {
    return { ok: false, error: "DUPLICATE_EMAIL", code: "DUPLICATE_EMAIL" };
  }

  const roles: AccountRole[] =
    input.role === "organizer" ? ["tourist", "organizer"] : [input.role];

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      phone: normalizedPhone,
      role: input.role,
      country: "Россия",
    },
  });

  if (createError) {
    const message = createError.message.toLowerCase();
    if (message.includes("already") || message.includes("registered")) {
      return { ok: false, error: "DUPLICATE_EMAIL", code: "DUPLICATE_EMAIL" };
    }
    return { ok: false, error: createError.message };
  }

  if (!created.user) {
    return { ok: false, error: "Не удалось создать аккаунт" };
  }

  const userId = created.user.id;

  let profile = await waitForProfile(admin, userId);

  if (!profile) {
    const { error: insertError } = await admin.from("profiles").insert({
      id: userId,
      email: normalizedEmail,
      first_name: firstName,
      last_name: lastName,
      phone: normalizedPhone,
      roles,
      active_role: input.role,
      country: "Россия",
    });

    if (insertError) {
      await admin.auth.admin.deleteUser(userId);
      return { ok: false, error: insertError.message };
    }

    profile = await waitForProfile(admin, userId);
  } else {
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        email: normalizedEmail,
        first_name: firstName,
        last_name: lastName,
        phone: normalizedPhone,
        roles,
        active_role: input.role,
      })
      .eq("id", userId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }
  }

  if (!profile) {
    return { ok: false, error: "Профиль не создан" };
  }

  return { ok: true, userId };
}

async function waitForProfile(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  attempts = 8
) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { data } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (data) return data;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return null;
}

export function sessionUserFromProfileId(
  profile: NonNullable<Awaited<ReturnType<typeof waitForProfile>>>,
  activeRole?: AccountRole
) {
  return profileToSessionUser(profile, activeRole);
}
