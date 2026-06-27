export const PARTNER_EXCURSION_BOOKING_THANK_YOU =
  "Спасибо за бронирование экскурсии. Вы перешли на сайт партнёра — дальнейшее бронирование будет осуществляться там.";

export const PARTNER_TOUR_BOOKING_THANK_YOU =
  "Спасибо за бронирование тура. Вы перешли на сайт партнёра — дальнейшее оформление будет осуществляться там.";

import {
  extractTripsterOrderId,
  isBrokenTripsterOrderPath,
  normalizeTripsterOrderUrl,
} from "@/lib/tripster/checkout-url";

/** Resolves relative Tripster paths and same-origin affiliate redirect URLs. */
export function normalizePartnerBookingUrl(url: string, origin?: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    if (extractTripsterOrderId(trimmed) || isBrokenTripsterOrderPath(trimmed)) {
      return normalizeTripsterOrderUrl(trimmed);
    }
    return trimmed;
  }

  if (trimmed.startsWith("/api/affiliate/go/")) {
    const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
    return base ? new URL(trimmed, base).toString() : trimmed;
  }

  if (extractTripsterOrderId(trimmed) || isBrokenTripsterOrderPath(trimmed)) {
    const absolute = trimmed.startsWith("/")
      ? `https://experience.tripster.ru${trimmed}`
      : trimmed;
    return normalizeTripsterOrderUrl(absolute);
  }

  if (trimmed.startsWith("/mfs/") || trimmed.startsWith("/experience/")) {
    return `https://experience.tripster.ru${trimmed}`;
  }

  if (trimmed.startsWith("/")) {
    return `https://experience.tripster.ru${trimmed}`;
  }

  return trimmed;
}

/** Opens partner checkout in a new tab. Returns false when the popup was blocked. */
export function openPartnerBookingUrl(url: string): boolean {
  const absolute = normalizePartnerBookingUrl(url);
  if (!absolute.trim() || isBrokenTripsterOrderPath(absolute)) return false;
  const opened = window.open(absolute, "_blank", "noopener,noreferrer");
  return opened != null;
}

export function resolveTripsterFallbackDescription(
  reason?: string | null
): string {
  switch (reason) {
    case "contact_on_partner_site":
      return "Открываем Tripster в новой вкладке с выбранной датой, временем и числом туристов. Контактные данные заполните на сайте партнёра.";
    case "external_orders_forbidden":
      return "API создания заказов Tripster не подключён к партнёрскому аккаунту. Открываем Tripster в новой вкладке с датой, временем и числом туристов — остальные данные заполните на сайте партнёра.";
    case "api_not_configured":
      return "Сервис бронирования Tripster не настроен на сервере. Открываем Tripster в новой вкладке с выбранными параметрами.";
    case "api_booking_rejected":
    case "partner_site_fallback":
      return "Не удалось создать заказ через API — откроем Tripster с вашей датой, временем и числом туристов. Останется заполнить контакты и подтвердить бронирование на сайте партнёра.";
    default:
      return "Автоматическое оформление сейчас недоступно — откроем Tripster в новой вкладке с датой, временем и числом туристов. Контактные данные заполните на сайте партнёра.";
  }
}

export function resolveYouTravelFallbackDescription(reason?: string | null): string {
  switch (reason) {
    case "contact_on_partner_site":
      return "Открываем YouTravel.me в новой вкладке с выбранной датой и числом туристов. Контактные данные заполните на сайте партнёра.";
    case "api_not_configured":
      return "Сервис бронирования YouTravel.me не настроен на сервере. Открываем YouTravel.me в новой вкладке с выбранными параметрами.";
    case "api_unauthorized":
    case "api_not_found":
      return "API бронирования YouTravel.me недоступен для партнёрского аккаунта. Открываем YouTravel.me в новой вкладке с датой и числом туристов — остальные данные заполните на сайте партнёра.";
    case "api_booking_rejected":
    case "partner_site_fallback":
      return "Не удалось создать заказ через API — откроем YouTravel.me с вашей датой и числом туристов. Останется заполнить контакты и подтвердить бронирование на сайте партнёра.";
    default:
      return "Автоматическое оформление сейчас недоступно — откроем YouTravel.me в новой вкладке с датой и числом туристов. Контактные данные заполните на сайте партнёра.";
  }
}
