export type AnalyticsPeriod = "7d" | "30d" | "90d" | "all";

export type TopAttributionSourceRow = {
  sourceKey: string;
  label: string;
  count: number;
};

export type DailyCountPoint = {
  date: string;
  count: number;
};

export type AdminAnalyticsV2Payload = {
  period: AnalyticsPeriod;
  periodStart: string | null;
  operations: {
    newsletterCount: number | null;
    contactCount: number | null;
    shopOrderCount: number | null;
    bookingCount: number | null;
    bookingsByStatus: Record<string, number> | null;
    contactsByKind: Record<string, number> | null;
    bookingPipelineUsd: number | null;
    shopPaidUsd: number | null;
    shopOrderUsd: number | null;
    topAttributionSources: TopAttributionSourceRow[] | null;
  };
  marketplace: {
    tourCount: number | null;
    pendingModerationCount: number | null;
    excursionExperienceCount: number | null;
    newToursInPeriod: number | null;
  };
  content: {
    blogPublished: number;
    blogPlanned: number;
    guideTopics: number;
    destinations: number;
    places: number;
  };
  trends: {
    bookingsByDay: DailyCountPoint[] | null;
    contactsByDay: DailyCountPoint[] | null;
    shopOrdersByDay: DailyCountPoint[] | null;
    newsletterByDay: DailyCountPoint[] | null;
  };
  dataQuality: {
    status: "ok" | "partial";
    checkedAt: string;
    unavailableMetrics: string[];
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

export type AnalyticsMetricStatus = "available" | "unavailable" | "untrusted";
export type AnalyticsMetricSource =
  | "controlled_analytics_events"
  | "bookings"
  | "payment_ledger"
  | "published_reviews";

export type AnalyticsMetric<T> = {
  value: T | null;
  status: AnalyticsMetricStatus;
  source: AnalyticsMetricSource;
  message: string | null;
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
  metrics: Record<AnalyticsFunnelStepId, AnalyticsMetric<number>>;
  cohortsMetric: AnalyticsMetric<number>;
  meta: {
    dataStatus: "trusted" | "untrusted_direct_insert" | "unavailable";
    trustedForKpi: boolean;
    reason: string | null;
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
