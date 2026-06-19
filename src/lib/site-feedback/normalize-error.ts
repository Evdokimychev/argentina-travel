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

const KNOWN_MESSAGES: Record<string, SiteFeedbackMessage> = {
  NOT_FOUND: {
    title: "Аккаунт не найден",
    description: "Проверьте номер телефона или зарегистрируйтесь.",
    steps: ["Убедитесь, что номер введён полностью", "Или создайте новый аккаунт"],
  },
  DUPLICATE_EMAIL: {
    title: "Эта почта уже занята",
    description: "Войдите в существующий аккаунт или укажите другой email.",
    steps: [
      "Нажмите «Войти» и используйте эту почту",
      "Если забыли пароль — нажмите «Забыли пароль?»",
    ],
  },
  DUPLICATE_PHONE: {
    title: "Этот номер уже зарегистрирован",
    description: "Войдите по телефону или email.",
    steps: ["Попробуйте войти с этим номером", "Или восстановите пароль по почте"],
  },
  INVALID_CREDENTIALS: {
    title: "Неверные данные для входа",
    description: "Проверьте email и пароль.",
    steps: [
      "Убедитесь, что раскладка клавиатуры верная",
      "Если регистрировались по телефону — используйте тот же пароль при входе по почте",
      "Нажмите «Забыли пароль?» для восстановления",
    ],
  },
  ROLE_NOT_CONNECTED: {
    title: "Роль организатора не подключена",
    description: "Аккаунт найден как турист. Можно подключить роль автора тура без новой регистрации.",
    steps: ["Войдите как турист и подключите роль", "Или выберите «Я турист» при входе"],
  },
  WRONG_ROLE: {
    title: "Выберите другой тип входа",
    description: "Этот аккаунт зарегистрирован с другой ролью.",
    steps: ["Переключите «Я турист» / «Я автор тура»", "Или войдите через кабинет организатора"],
  },
  PROFILE_MISSING: {
    title: "Профиль не синхронизирован",
    description: "Вход выполнен, но данные профиля не найдены.",
    steps: ["Напишите в поддержку с указанием email", "Мы восстановим доступ вручную"],
    action: { label: "Написать в поддержку", href: "/contacts" },
  },
};

function matchKnownMessage(raw: string): SiteFeedbackMessage | undefined {
  if (KNOWN_MESSAGES[raw]) {
    return KNOWN_MESSAGES[raw];
  }

  const lower = raw.toLowerCase();

  if (raw.includes("Неверный email или пароль") || raw.includes("Неверный пароль")) {
    return KNOWN_MESSAGES.INVALID_CREDENTIALS;
  }

  if (raw.includes("ROLE_NOT_CONNECTED") || raw.includes("роль организатора не подключена")) {
    return KNOWN_MESSAGES.ROLE_NOT_CONNECTED;
  }

  if (raw.includes("WRONG_ROLE") || raw.includes("зарегистрирована как автор тура")) {
    return KNOWN_MESSAGES.WRONG_ROLE;
  }

  if (lower.includes("profile") && lower.includes("не найден")) {
    return KNOWN_MESSAGES.PROFILE_MISSING;
  }

  return undefined;
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

  const matched = matchKnownMessage(raw);
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

export function passwordResetSentMessage(email: string): SiteFeedbackMessage {
  return {
    title: "Письмо отправлено",
    description: `Если аккаунт с адресом ${email} зарегистрирован, вы получите ссылку для смены пароля.`,
    steps: [
      "Проверьте папку «Спам»",
      "Ссылка действует ограниченное время",
      "После смены пароля войдите с новыми данными",
    ],
  };
}
