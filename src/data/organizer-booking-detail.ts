import type { BookingStatusActive } from "@/types/tourist";

export interface OrganizerBookingStatusMeta {
  headline: string;
  toneClass: string;
  iconToneClass: string;
  actionHint: string;
  sidebarTitle: string;
}

export const ORGANIZER_BOOKING_STATUS_META: Record<BookingStatusActive, OrganizerBookingStatusMeta> = {
  new: {
    headline: "Новая заявка",
    toneClass: "text-violet-700",
    iconToneClass: "bg-violet-50 text-violet-600",
    actionHint: "Примите заявку в работу или подтвердите бронирование, если места доступны.",
    sidebarTitle: "Обработайте новую заявку",
  },
  pending: {
    headline: "Ожидает подтверждения",
    toneClass: "text-sky",
    iconToneClass: "bg-sky/10 text-sky",
    actionHint: "Подтвердите наличие мест и свяжитесь с туристом для уточнения деталей.",
    sidebarTitle: "Подтвердите заявку",
  },
  confirmed: {
    headline: "Подтверждена",
    toneClass: "text-emerald-700",
    iconToneClass: "bg-emerald-50 text-emerald-600",
    actionHint: "Заявка подтверждена. После завершения тура отметьте поездку как завершённую.",
    sidebarTitle: "Заявка подтверждена",
  },
  cancelled: {
    headline: "Отменена",
    toneClass: "text-slate",
    iconToneClass: "bg-gray-100 text-slate",
    actionHint: "Заявка отменена. Дальнейшие действия не требуются.",
    sidebarTitle: "Заявка отменена",
  },
  completed: {
    headline: "Завершена",
    toneClass: "text-sky",
    iconToneClass: "bg-sky/10 text-sky",
    actionHint: "Поездка завершена. Заявка сохранена в архиве.",
    sidebarTitle: "Поездка завершена",
  },
};

export function getOrganizerBookingAlerts(status: BookingStatusActive, hasDates: boolean) {
  const alerts: Array<{ tone: "amber" | "yellow"; text: string }> = [];

  if (status === "new" || status === "pending") {
    alerts.push({
      tone: "amber",
      text: "Это заявка с сайта «Пора в Аргентину». Подтвердите бронирование, если клиент готов ехать, или отмените заявку, если мест нет.",
    });
  }

  if ((status === "new" || status === "pending") && !hasDates) {
    alerts.push({
      tone: "yellow",
      text: "Турист не указал конкретные даты. Свяжитесь с ним, чтобы согласовать даты поездки.",
    });
  }

  return alerts;
}

export const ORGANIZER_BOOKING_DATA_BADGE: Record<
  BookingStatusActive,
  { label: string; className: string }
> = {
  new: { label: "Новая заявка", className: "bg-violet-50 text-violet-800 ring-violet-200/60" },
  pending: { label: "Ожидает подтверждения", className: "bg-amber-50 text-amber-900 ring-amber-200/60" },
  confirmed: { label: "Подтверждена", className: "bg-emerald-50 text-emerald-800 ring-emerald-200/60" },
  cancelled: { label: "Отменена", className: "bg-gray-100 text-slate ring-gray-200/60" },
  completed: { label: "Завершена", className: "bg-sky/10 text-sky ring-sky/20" },
};
