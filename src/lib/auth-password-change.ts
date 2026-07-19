export type PasswordChangeInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type PasswordChangeErrorCode =
  | "CURRENT_PASSWORD_REQUIRED"
  | "PASSWORD_TOO_SHORT"
  | "PASSWORD_MISMATCH"
  | "PASSWORD_UNCHANGED"
  | "ACCOUNT_UNAVAILABLE"
  | "CURRENT_PASSWORD_INVALID"
  | "PASSWORD_UPDATE_FAILED";

export type PasswordChangeResult =
  | { ok: true }
  | { ok: false; code: PasswordChangeErrorCode; message: string };

type AuthErrorLike = { message?: string } | null;

export type PasswordChangeAuthClient = {
  auth: {
    getUser(): Promise<{
      data: { user: { email?: string | null } | null };
      error: unknown | null;
    }>;
    signInWithPassword(input: {
      email: string;
      password: string;
    }): Promise<{ error: AuthErrorLike }>;
    updateUser(input: { password: string }): Promise<{ error: AuthErrorLike }>;
  };
};

export function validatePasswordChange(input: PasswordChangeInput): PasswordChangeResult {
  if (!input.currentPassword) {
    return {
      ok: false,
      code: "CURRENT_PASSWORD_REQUIRED",
      message: "Введите текущий пароль для подтверждения.",
    };
  }
  if (input.newPassword.length < 8) {
    return {
      ok: false,
      code: "PASSWORD_TOO_SHORT",
      message: "Новый пароль должен содержать не менее 8 символов.",
    };
  }
  if (input.newPassword !== input.confirmPassword) {
    return {
      ok: false,
      code: "PASSWORD_MISMATCH",
      message: "Пароли не совпадают.",
    };
  }
  if (input.newPassword === input.currentPassword) {
    return {
      ok: false,
      code: "PASSWORD_UNCHANGED",
      message: "Новый пароль должен отличаться от текущего.",
    };
  }
  return { ok: true };
}

/** Reauthenticate with the current password before changing it. */
export async function changePasswordWithCurrentCredential(
  client: PasswordChangeAuthClient,
  input: PasswordChangeInput,
): Promise<PasswordChangeResult> {
  const validation = validatePasswordChange(input);
  if (!validation.ok) return validation;

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  const email = user?.email?.trim();
  if (userError || !email) {
    return {
      ok: false,
      code: "ACCOUNT_UNAVAILABLE",
      message: "Не удалось определить аккаунт. Войдите снова и повторите попытку.",
    };
  }

  const { error: reauthenticationError } = await client.auth.signInWithPassword({
    email,
    password: input.currentPassword,
  });
  if (reauthenticationError) {
    return {
      ok: false,
      code: "CURRENT_PASSWORD_INVALID",
      message: "Текущий пароль указан неверно.",
    };
  }

  const { error: updateError } = await client.auth.updateUser({
    password: input.newPassword,
  });
  if (updateError) {
    return {
      ok: false,
      code: "PASSWORD_UPDATE_FAILED",
      message: "Не удалось сменить пароль. Попробуйте ещё раз.",
    };
  }

  return { ok: true };
}
