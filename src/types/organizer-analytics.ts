import type { OrganizerFunnelStats } from "@/lib/organizer-analytics";

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "365d" | "all";

export interface AnalyticsPeriodBounds {
  period: AnalyticsPeriod;
  from: string | null;
  to: string;
  label: string;
}

export interface AnalyticsDailyPoint {
  date: string;
  label: string;
  value: number;
}

export interface AnalyticsMonthlyPoint {
  month: string;
  label: string;
  bookings: number;
  revenueUsd: number;
}

export interface AnalyticsBreakdownRow {
  id: string;
  label: string;
  bookings: number;
  revenueUsd: number;
  sharePct: number;
}

export interface TourPerformanceRow {
  tourSlug: string;
  tourTitle: string;
  isPrivate: boolean;
  type: "tour" | "excursion";
  region: string;
  activityType: string;
  bookingsCount: number;
  confirmedCount: number;
  revenueUsd: number;
  averageOrderValueUsd: number | null;
  totalGuests: number;
  conversionRate: number | null;
  waitlistCount: number;
}

export interface CustomerSpenderRow {
  contactEmail: string;
  contactName: string;
  bookingsCount: number;
  revenueUsd: number;
  isReturning: boolean;
}

export interface OrganizerBasicAnalyticsReport {
  period: AnalyticsPeriodBounds;
  kpis: {
    totalBookings: number;
    confirmedBookings: number;
    revenueUsd: number;
    averageOrderValueUsd: number | null;
    uniqueCustomers: number;
    publishedTours: number;
    privateTours: number;
    waitlistActive: number;
    conversionRate: number | null;
    pendingPayments: number;
  };
  funnel: OrganizerFunnelStats;
  recentTrend: AnalyticsDailyPoint[];
  reviewsSummary: { count: number; averageRating: number | null };
}

export interface OrganizerAdvancedAnalyticsReport {
  period: AnalyticsPeriodBounds;
  growth: {
    bookingsChangePct: number | null;
    revenueChangePct: number | null;
    customersChangePct: number | null;
  };
  timeSeries: {
    bookings: AnalyticsDailyPoint[];
    revenue: AnalyticsDailyPoint[];
  };
  monthlySeries: AnalyticsMonthlyPoint[];
  tourPerformance: TourPerformanceRow[];
  topByBookings: TourPerformanceRow[];
  topByRevenue: TourPerformanceRow[];
  visibilitySplit: {
    public: { bookings: number; revenueUsd: number; tours: number };
    private: { bookings: number; revenueUsd: number; tours: number };
  };
  regions: AnalyticsBreakdownRow[];
  activities: AnalyticsBreakdownRow[];
  tourTypes: AnalyticsBreakdownRow[];
  customers: {
    uniqueTotal: number;
    returningCount: number;
    returningRatePct: number | null;
    topSpenders: CustomerSpenderRow[];
    averageGuestsPerBooking: number | null;
    averageLeadTimeDays: number | null;
  };
  waitlist: {
    totalEntries: number;
    convertedCount: number;
    conversionRatePct: number | null;
    activeCount: number;
  };
  payments: {
    collectedUsd: number;
    outstandingUsd: number;
  };
}

export const ANALYTICS_PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  "7d": "7 дней",
  "30d": "30 дней",
  "90d": "90 дней",
  "365d": "12 месяцев",
  all: "Всё время",
};
