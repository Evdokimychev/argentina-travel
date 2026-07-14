import { normalizePhone } from "@/lib/auth-input";

export type PhoneAccountLookupResult =
  | { status: "found" }
  | { status: "not_found" }
  | { status: "error"; message: string };

export type EmailAccountLookupResult =
  | { status: "found" | "not_found" | "needs_repair" | "unconfirmed" }
  | { status: "error"; message: string };

export async function lookupEmailAccount(email: string): Promise<EmailAccountLookupResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return { status: "error", message: "Укажите корректный email" };
  }
  try {
    const response = await fetch("/api/auth/lookup-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email: normalized }),
    });
    const body = (await response.json().catch(() => null)) as
      | { status?: "found" | "not_found" | "needs_repair" | "unconfirmed"; error?: string }
      | null;
    if (!response.ok || !body?.status) {
      return { status: "error", message: body?.error ?? "Не удалось проверить аккаунт" };
    }
    return { status: body.status };
  } catch {
    return { status: "error", message: "Не удалось проверить аккаунт. Проверьте соединение." };
  }
}

/** Проверяет, есть ли профиль с таким телефоном (без входа). */
export async function lookupPhoneAccount(phone: string): Promise<PhoneAccountLookupResult> {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return { status: "error", message: "Введите корректный номер телефона" };
  }

  try {
    const response = await fetch("/api/auth/lookup-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ phone: normalized }),
    });

    if (response.status === 404) {
      return { status: "not_found" };
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      return {
        status: "error",
        message: body?.error ?? "Не удалось проверить номер. Попробуйте позже.",
      };
    }

    return { status: "found" };
  } catch {
    return { status: "error", message: "Не удалось проверить номер. Проверьте соединение." };
  }
}

export function resolveAuthGreeting(fullName?: string | null): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return "Добро пожаловать!";
  const firstName = trimmed.split(/\s+/)[0];
  return firstName ? `Здравствуйте, ${firstName}!` : "Добро пожаловать!";
}
