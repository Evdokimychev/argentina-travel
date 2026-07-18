export const PUBLIC_API_ERROR_MESSAGES = {
  SERVICE_UNAVAILABLE: "Сервис временно недоступен. Попробуйте ещё раз немного позже.",
  RESOURCE_NOT_FOUND: "Запрошенные данные не найдены или больше недоступны.",
  INVALID_REQUEST: "Не удалось обработать запрос. Проверьте данные и попробуйте снова.",
  AUTH_REQUIRED: "Войдите в аккаунт, чтобы продолжить.",
  ACCESS_DENIED: "У вас нет доступа к этому действию.",
  PARTNER_DATA_UNAVAILABLE: "Данные партнёра временно недоступны. Попробуйте позже.",
  PAYMENT_UNAVAILABLE: "Оплата временно недоступна. Выберите другой способ или попробуйте позже.",
  PAYMENT_LINK_UNAVAILABLE: "Ссылка на оплату недоступна. Запросите новую ссылку.",
  PAYMENT_LINK_EXPIRED: "Срок действия ссылки на оплату истёк. Запросите новую ссылку.",
  PAYMENT_NOT_ALLOWED: "Эту заявку сейчас нельзя оплатить.",
  PAYMENT_ALREADY_COMPLETED: "Эта заявка уже оплачена.",
  PAYMENT_PROCESSING_FAILED: "Не удалось открыть оплату. Попробуйте снова или обратитесь в поддержку.",
  REQUEST_NOT_FOUND: "Заявка не найдена или больше недоступна.",
} as const;

export type PublicApiErrorCode = keyof typeof PUBLIC_API_ERROR_MESSAGES;

export type PublicApiErrorPayload = {
  code: PublicApiErrorCode;
  error: string;
};

export function publicApiError(code: PublicApiErrorCode): PublicApiErrorPayload {
  return { code, error: PUBLIC_API_ERROR_MESSAGES[code] };
}

export function resolvePublicApiErrorMessage(code: string | null | undefined): string {
  if (code && code in PUBLIC_API_ERROR_MESSAGES) {
    return PUBLIC_API_ERROR_MESSAGES[code as PublicApiErrorCode];
  }
  return PUBLIC_API_ERROR_MESSAGES.SERVICE_UNAVAILABLE;
}
