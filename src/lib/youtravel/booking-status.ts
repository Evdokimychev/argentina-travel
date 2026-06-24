export type YouTravelBookingStatusTone = "success" | "warning" | "neutral" | "error";

export const YOUTRAVEL_BOOKING_STATUS_LABELS: Record<string, string> = {
  submitted: "Отправлена",
  pending: "В обработке",
  confirmed: "Подтверждена",
  cancelled: "Отменена",
  completed: "Завершена",
  affiliate_fallback: "Перенаправлена на сайт",
  failed: "Ошибка отправки",
  api_unavailable: "API недоступен",
  api_unauthorized: "API не активирован",
  api_not_configured: "API не настроен",
};

const TERMINAL_STATUSES = new Set([
  "affiliate_fallback",
  "completed",
  "cancelled",
  "failed",
]);

export function formatYouTravelBookingStatus(status: string | null | undefined): string {
  const key = status?.trim().toLowerCase() || "";
  if (!key) return "Статус уточняется";
  return YOUTRAVEL_BOOKING_STATUS_LABELS[key] ?? status ?? "Статус уточняется";
}

export function resolveYouTravelBookingStatusTone(
  status: string | null | undefined
): YouTravelBookingStatusTone {
  const key = status?.trim().toLowerCase() || "";

  if (key === "confirmed" || key === "completed") return "success";
  if (key === "pending" || key === "submitted") return "warning";
  if (
    key === "failed" ||
    key === "cancelled" ||
    key === "api_unavailable" ||
    key === "api_unauthorized" ||
    key === "api_not_configured"
  ) {
    return "error";
  }
  if (key === "affiliate_fallback") return "neutral";
  return "neutral";
}

export function isYouTravelBookingStatusTerminal(status: string | null | undefined): boolean {
  const key = status?.trim().toLowerCase() || "";
  return TERMINAL_STATUSES.has(key);
}
