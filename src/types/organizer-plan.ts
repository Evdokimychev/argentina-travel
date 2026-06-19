/** Тариф организатора — влияет на доступ к расширенной аналитике и будущим комиссиям. */
export type OrganizerPlanTier = "starter" | "pro" | "agency";

export interface OrganizerPlanDefinition {
  id: OrganizerPlanTier;
  label: string;
  description: string;
  /** Расширенная аналитика (WTE Advanced Analytics). */
  advancedAnalytics: boolean;
  /** Будущее: внешняя ссылка на бронирование (Custom Booking Link). */
  customBookingLink: boolean;
  /** Будущее: пониженная комиссия платформы. */
  commissionRateHint?: string;
}

export const ORGANIZER_PLANS: Record<OrganizerPlanTier, OrganizerPlanDefinition> = {
  starter: {
    id: "starter",
    label: "Стартовый",
    description: "Базовая аналитика и CRM для частных туров и небольших команд.",
    advancedAnalytics: false,
    customBookingLink: true,
    commissionRateHint: "стандартная",
  },
  pro: {
    id: "pro",
    label: "Профи",
    description: "Расширенная аналитика, сегменты и динамика для роста продаж.",
    advancedAnalytics: true,
    customBookingLink: true,
    commissionRateHint: "сниженная",
  },
  agency: {
    id: "agency",
    label: "Агентство",
    description: "Полный набор метрик для нескольких направлений и команды гидов.",
    advancedAnalytics: true,
    customBookingLink: true,
    commissionRateHint: "минимальная",
  },
};

export const ORGANIZER_PLAN_STORE_KEY = "argentina-travel-organizer-plan-tier";
export const ORGANIZER_PLAN_UPDATED_EVENT = "organizer-plan-updated";
