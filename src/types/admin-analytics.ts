export type AnalyticsPeriod = "7d" | "30d" | "90d" | "all";

export type DailyCountPoint = {
  date: string;
  count: number;
};

export type AdminAnalyticsV2Payload = {
  period: AnalyticsPeriod;
  periodStart: string | null;
  operations: {
    newsletterCount: number;
    contactCount: number;
    shopOrderCount: number;
    bookingCount: number;
    bookingsByStatus: Record<string, number>;
    contactsByKind: Record<string, number>;
    bookingPipelineUsd: number;
    shopPaidUsd: number;
    shopOrderUsd: number;
  };
  marketplace: {
    tourCount: number;
    pendingModerationCount: number;
    excursionExperienceCount: number;
    newToursInPeriod: number;
  };
  content: {
    blogPublished: number;
    blogPlanned: number;
    guideTopics: number;
    destinations: number;
    places: number;
  };
  trends: {
    bookingsByDay: DailyCountPoint[];
    contactsByDay: DailyCountPoint[];
    shopOrdersByDay: DailyCountPoint[];
    newsletterByDay: DailyCountPoint[];
  };
};

export const ANALYTICS_PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  "7d": "7 дней",
  "30d": "30 дней",
  "90d": "90 дней",
  all: "Всё время",
};

export const CONTACT_KIND_LABELS: Record<string, string> = {
  general: "Общие",
  tour_inquiry: "Вопрос по туру",
  service_request: "Услуга",
  product_inquiry: "Магазин",
  organizer_application: "Организатор",
  consultation: "Консультация",
};

export type AnalyticsFunnelStepId =
  | "tour_view"
  | "booking_started"
  | "confirmed"
  | "paid"
  | "review";

export type AnalyticsFunnelStep = {
  id: AnalyticsFunnelStepId;
  label: string;
  count: number;
  rateFromPrevious: number | null;
  rateFromFirst: number | null;
};

export type AnalyticsCohortMonth = {
  month: string;
  label: string;
  bookings: number;
  /** Заглушка удержания — полная когортная аналитика в следующих итерациях */
  retentionStub: number | null;
};

export type AdminAnalyticsFunnelsPayload = {
  period: AnalyticsPeriod;
  periodStart: string | null;
  generatedAt: string;
  funnel: AnalyticsFunnelStep[];
  cohorts: AnalyticsCohortMonth[];
  meta: {
    tourViewsSource: "events" | "estimate";
    hasTourViewData: boolean;
  };
};

export type AnalyticsExportType = "bookings" | "reviews" | "payments";

export const ANALYTICS_FUNNEL_STEP_LABELS: Record<AnalyticsFunnelStepId, string> = {
  tour_view: "Просмотр тура",
  booking_started: "Начало бронирования",
  confirmed: "Подтверждение",
  paid: "Оплата",
  review: "Отзыв",
};

export const ANALYTICS_EXPORT_TYPE_LABELS: Record<AnalyticsExportType, string> = {
  bookings: "Бронирования",
  reviews: "Отзывы",
  payments: "Платежи",
};
