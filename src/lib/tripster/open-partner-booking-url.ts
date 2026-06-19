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
    default:
      return "Автоматическое оформление сейчас недоступно — откроем Tripster в новой вкладке с датой и числом туристов. Контакты нужно будет ввести заново.";
  }
}
