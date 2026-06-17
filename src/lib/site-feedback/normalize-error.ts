import type { SiteFeedbackMessage } from "@/types/site-feedback";

const NETWORK_HINT: SiteFeedbackMessage = {
  title: "Нет связи с сервером",
  description: "Проверьте интернет и попробуйте ещё раз.",
  steps: [
    "Обновите страницу",
    "Если ошибка повторяется — напишите нам через форму контактов",
  ],
  action: { label: "Контакты", href: "/contacts" },
};

const GENERIC_HINT: SiteFeedbackMessage = {
  title: "Не удалось выполнить действие",
  description: "Попробуйте ещё раз через минуту.",
  steps: [
    "Обновите страницу",
    "Проверьте, что все поля заполнены корректно",
    "Если проблема остаётся — свяжитесь с поддержкой",
  ],
  action: { label: "Написать в поддержку", href: "/contacts" },
};

function isNetworkError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("load failed") ||
    lower.includes("networkerror")
  );
}

export function normalizeSiteError(
  error: unknown,
  context?: Partial<SiteFeedbackMessage>
): SiteFeedbackMessage {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Не удалось выполнить действие";

  if (isNetworkError(raw)) {
    return { ...NETWORK_HINT, ...context };
  }

  const known: Record<string, SiteFeedbackMessage> = {
    NOT_FOUND: {
      title: "Аккаунт не найден",
      description: "Проверьте номер телефона или зарегистрируйтесь.",
      steps: ["Убедитесь, что номер введён полностью", "Или создайте новый аккаунт"],
    },
    DUPLICATE_EMAIL: {
      title: "Эта почта уже занята",
      description: "Войдите в существующий аккаунт или укажите другой email.",
      steps: ["Нажмите «Войти» и используйте эту почту", "Или укажите другой адрес при регистрации"],
    },
    DUPLICATE_PHONE: {
      title: "Этот номер уже зарегистрирован",
      description: "Войдите по телефону или email.",
      steps: ["Попробуйте войти с этим номером", "Если забыли пароль — войдите по почте"],
    },
    INVALID_CREDENTIALS: {
      title: "Неверные данные для входа",
      description: "Проверьте email и пароль.",
      steps: ["Убедитесь, что раскладка клавиатуры верная", "При регистрации используйте тот же пароль"],
    },
  };

  const matched = known[raw];
  if (matched) {
    return { ...matched, ...context };
  }

  return {
    ...GENERIC_HINT,
    description: raw || GENERIC_HINT.description,
    ...context,
  };
}

export function mergeFeedback(
  base: SiteFeedbackMessage,
  override?: Partial<SiteFeedbackMessage>
): SiteFeedbackMessage {
  if (!override) return base;
  return {
    ...base,
    ...override,
    steps: override.steps ?? base.steps,
    action: override.action ?? base.action,
  };
}

/** Короткая ошибка валидации формы (inline + toast). */
export function siteFormError(
  description: string,
  options?: { title?: string; steps?: string[]; action?: SiteFeedbackMessage["action"] }
): SiteFeedbackMessage {
  return {
    title: options?.title ?? "Проверьте данные",
    description,
    steps: options?.steps,
    action: options?.action,
  };
}

/** Успешное действие с опциональным следующим шагом. */
export function siteSuccessMessage(
  title: string,
  description?: string,
  action?: SiteFeedbackMessage["action"]
): SiteFeedbackMessage {
  return { title, description, action };
}
