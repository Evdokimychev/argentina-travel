import { normalizePhone } from "@/lib/auth-store";

export type PhoneAccountLookupResult =
  | { status: "found" }
  | { status: "not_found" }
  | { status: "error"; message: string };

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
