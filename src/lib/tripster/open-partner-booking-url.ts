export const PARTNER_EXCURSION_BOOKING_THANK_YOU =
  "Спасибо за бронирование экскурсии. Вы перешли на сайт партнёра — дальнейшее бронирование будет осуществляться там.";

export const PARTNER_TOUR_BOOKING_THANK_YOU =
  "Спасибо за бронирование тура. Вы перешли на сайт партнёра — дальнейшее оформление будет осуществляться там.";

/** Resolves relative Tripster paths and same-origin affiliate redirect URLs. */
export function normalizePartnerBookingUrl(url: string, origin?: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  if (trimmed.startsWith("/api/affiliate/go/")) {
    const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
    return base ? new URL(trimmed, base).toString() : trimmed;
  }

  if (trimmed.startsWith("/")) {
    return `https://experience.tripster.ru${trimmed}`;
  }

  return trimmed;
}

/** Opens partner checkout in a new tab. Returns false when the popup was blocked. */
export function openPartnerBookingUrl(url: string): boolean {
  const absolute = normalizePartnerBookingUrl(url);
  const opened = window.open(absolute, "_blank", "noopener,noreferrer");
  return opened != null;
}

export function resolveTripsterFallbackDescription(
  reason?: string | null
): string {
  switch (reason) {
    case "external_orders_forbidden":
      return "API создания заказов Tripster не подключён к партнёрскому аккаунту. Открываем Tripster в новой вкладке с датой и числом туристов — контакты нужно будет ввести вручную.";
    case "api_not_configured":
      return "Сервис бронирования Tripster не настроен на сервере. Открываем Tripster в новой вкладке с выбранными параметрами.";
    case "api_booking_rejected":
    case "partner_site_fallback":
      return "Не удалось создать заказ через API — откроем Tripster с вашей датой, числом туристов и контактами. Останется подтвердить бронирование на сайте партнёра.";
    default:
      return "Автоматическое оформление сейчас недоступно — откроем Tripster в новой вкладке с датой, числом туристов и контактами.";
  }
}

export function resolveYouTravelFallbackDescription(reason?: string | null): string {
  switch (reason) {
    case "api_not_configured":
      return "Сервис бронирования YouTravel.me не настроен на сервере. Открываем YouTravel.me в новой вкладке с выбранными параметрами.";
    case "api_unauthorized":
    case "api_not_found":
      return "API бронирования YouTravel.me недоступен для партнёрского аккаунта. Открываем YouTravel.me в новой вкладке с датой, числом туристов и контактами.";
    case "api_booking_rejected":
    case "partner_site_fallback":
      return "Не удалось создать заказ через API — откроем YouTravel.me с вашей датой, числом туристов и контактами. Останется подтвердить бронирование на сайте партнёра.";
    default:
      return "Автоматическое оформление сейчас недоступно — откроем YouTravel.me в новой вкладке с датой, числом туристов и контактами.";
  }
}
