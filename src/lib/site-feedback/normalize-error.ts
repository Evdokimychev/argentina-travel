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

const SERVICE_UNAVAILABLE_HINT: SiteFeedbackMessage = {
  title: "Сервис временно недоступен",
  description: "Данные с сервера сейчас недоступны. Попробуйте обновить страницу позже.",
  steps: [
    "Подождите минуту и обновите страницу",
    "Если каталог пуст или карта не загружается — это может быть временный сбой",
    "Напишите нам, если проблема не исчезает",
  ],
  action: { label: "Контакты", href: "/contacts" },
};

const RATE_LIMIT_HINT: SiteFeedbackMessage = {
  title: "Слишком много запросов",
  description: "Подождите немного и попробуйте снова.",
};

function isNetworkError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("load failed") ||
    lower.includes("networkerror") ||
    lower.includes("aborted") ||
    lower.includes("timeout")
  );
}

function isServiceUnavailable(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("503") ||
    lower.includes("502") ||
    lower.includes("504") ||
    lower.includes("service unavailable") ||
    lower.includes("exceed_egress") ||
    lower.includes("egress quota") ||
    lower.includes("database") ||
    lower.includes("supabase") ||
    lower.includes("connection") ||
    lower.includes("temporarily unavailable") ||
    lower.includes("ошибка сервера")
  );
}

function isRateLimited(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("429") || lower.includes("too many") || lower.includes("rate limit");
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
    title: "Пароль не подходит",
    description: "Проверьте пароль или восстановите доступ.",
    action: { label: "Восстановить пароль", href: "/?auth=sign-in&step=forgot-password" },
  },
  EMAIL_NOT_CONFIRMED: {
    title: "Подтвердите email",
    description: "Откройте последнее письмо регистрации и перейдите по ссылке.",
  },
  RATE_LIMITED: {
    title: "Нужно немного подождать",
    description: "Повторная попытка станет доступна автоматически.",
  },
  USER_BANNED: {
    title: "Доступ ограничен",
    description: "Обратитесь в поддержку, если считаете это ошибкой.",
    action: { label: "Поддержка", href: "/contacts" },
  },
  NETWORK_ERROR: {
    title: "Нет связи с сервером",
    description: "Проверьте подключение к интернету и повторите попытку.",
  },
  CONFIGURATION_ERROR: {
    title: "Вход временно недоступен",
    description: "Проверьте настройки сервиса и попробуйте позже.",
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
  ACCOUNT_BLOCKED: {
    title: "Аккаунт заблокирован",
    description: "Доступ к платформе ограничен администратором.",
    steps: ["Напишите в поддержку, если считаете это ошибкой"],
    action: { label: "Контакты", href: "/contacts" },
  },
  EXPIRED_LINK: {
    title: "Ссылка устарела",
    description: "Ссылка для подтверждения или восстановления пароля больше не действует.",
    steps: [
      "Запросите восстановление пароля ещё раз",
      "Проверьте, что используете последнее письмо",
    ],
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

  if (raw.includes("заблокирован") || raw.includes("banned")) {
    return KNOWN_MESSAGES.ACCOUNT_BLOCKED;
  }

  if (raw.includes("устарела") || raw.includes("EXPIRED_LINK")) {
    return KNOWN_MESSAGES.EXPIRED_LINK;
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

  if (isRateLimited(raw)) {
    return { ...RATE_LIMIT_HINT, ...context };
  }

  if (isServiceUnavailable(raw)) {
    return { ...SERVICE_UNAVAILABLE_HINT, ...context };
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

export function passwordResetSentMessage(): SiteFeedbackMessage {
  return {
    title: "Письмо отправлено",
    description: "Если этот адрес зарегистрирован, мы отправили ссылку для изменения пароля.",
  };
}
