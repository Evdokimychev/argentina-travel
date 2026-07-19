export const PUBLIC_BOOKING_ERROR_MESSAGES = {
  BOOKING_INVALID_REQUEST:
    "Не удалось прочитать данные заявки. Обновите страницу и попробуйте снова.",
  BOOKING_VERIFICATION_UNAVAILABLE:
    "Бронирование временно недоступно. Попробуйте ещё раз немного позже.",
  BOOKING_VERIFICATION_FAILED:
    "Не удалось подтвердить отправку формы. Обновите страницу и попробуйте снова.",
  BOOKING_SECTION_UNAVAILABLE:
    "Этот раздел временно недоступен. Выберите другое предложение или попробуйте позже.",
  BOOKING_PRODUCT_NOT_FOUND:
    "Предложение не найдено или больше недоступно для бронирования.",
  BOOKING_REQUIRED_FIELDS:
    "Проверьте дату, время, число участников и контактные данные.",
  BOOKING_CONTACT_INVALID:
    "Проверьте имя, email и телефон, затем отправьте заявку снова.",
  BOOKING_USE_SITE_CHECKOUT:
    "Продолжите оформление заявки на странице выбранного предложения.",
  BOOKING_REQUEST_KEY_INVALID:
    "Не удалось безопасно отправить заявку. Обновите страницу и попробуйте снова.",
  BOOKING_REQUEST_CONFLICT:
    "Эта попытка уже использована для другой заявки. Обновите страницу и повторите отправку.",
  BOOKING_REQUEST_IN_PROGRESS:
    "Заявка уже отправляется. Подождите несколько секунд и не отправляйте её повторно.",
  BOOKING_PARTNER_HANDOFF:
    "Продолжаем бронирование на сайте партнёра с выбранными параметрами.",
  BOOKING_PARTNER_REJECTED:
    "Партнёр не смог принять заявку. Продолжите бронирование на его сайте.",
  BOOKING_SERVICE_UNAVAILABLE:
    "Не удалось завершить бронирование здесь. Попробуйте позже или продолжите на сайте партнёра.",
  BOOKING_AUTH_REQUIRED:
    "Войдите в аккаунт, чтобы посмотреть свои заявки.",
} as const;

export type PublicBookingErrorCode = keyof typeof PUBLIC_BOOKING_ERROR_MESSAGES;

export type PublicBookingErrorPayload = {
  code: PublicBookingErrorCode;
  error: string;
};

export function publicBookingError(code: PublicBookingErrorCode): PublicBookingErrorPayload {
  return { code, error: PUBLIC_BOOKING_ERROR_MESSAGES[code] };
}

export function resolvePublicBookingErrorMessage(
  code: string | null | undefined,
): string {
  if (code && code in PUBLIC_BOOKING_ERROR_MESSAGES) {
    return PUBLIC_BOOKING_ERROR_MESSAGES[code as PublicBookingErrorCode];
  }
  return PUBLIC_BOOKING_ERROR_MESSAGES.BOOKING_SERVICE_UNAVAILABLE;
}
