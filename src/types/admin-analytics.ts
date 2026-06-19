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
