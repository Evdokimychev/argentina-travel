/** Открывает страницу оформления Tripster в новой вкладке; при блокировке — в текущей. */
export function openPartnerBookingUrl(url: string): void {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.assign(url);
  }
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
