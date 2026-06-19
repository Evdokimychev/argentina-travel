import { getOrganizerBookings, getOrganizerBookingStats } from "@/lib/bookings-store";
import { resolveBookingAmounts } from "@/lib/booking-payment-display";
import { getOrganizerCatalogSlugs } from "@/lib/organizer-bookings";
import {
  getOrganizerTourListingsForUser,
  readOrganizerTourDraft,
} from "@/lib/organizer-tour-store";
import { getOrganizerReviewsSummary } from "@/lib/organizer-reviews";
import { getOrganizerCabinetWaitlistStats } from "@/lib/organizer-waitlist";
import { getOrganizerWaitlistEntries } from "@/lib/waitlist-store";
import { getCatalogSlug } from "@/lib/tour-slug";
import type { Booking } from "@/types/tourist";
import type {
  AnalyticsBreakdownRow,
  AnalyticsDailyPoint,
  AnalyticsMonthlyPoint,
  AnalyticsPeriod,
  AnalyticsPeriodBounds,
  CustomerSpenderRow,
  OrganizerAdvancedAnalyticsReport,
  OrganizerBasicAnalyticsReport,
  TourPerformanceRow,
} from "@/types/organizer-analytics";
import { ANALYTICS_PERIOD_LABELS } from "@/types/organizer-analytics";

export interface OrganizerFunnelStats {
  new: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  total: number;
}

export interface OrganizerAnalytics {
  bookingStats: ReturnType<typeof getOrganizerBookingStats>;
  funnel: OrganizerFunnelStats;
  revenueUsd: number;
  pendingPaymentsCount: number;
  publishedToursCount: number;
  draftToursCount: number;
  archivedToursCount: number;
  conversionRate: number | null;
  conversionFunnel: {
    started: number;
    confirmed: number;
    paid: number;
    reviewed: number;
    bookingToConfirmedPct: number | null;
    bookingToPaidPct: number | null;
    bookingToReviewPct: number | null;
  };
}

interface TourMeta {
  tourSlug: string;
  tourTitle: string;
  isPrivate: boolean;
  type: "tour" | "excursion";
  region: string;
  activityType: string;
}

function isRevenueBooking(booking: Booking): boolean {
  return booking.status === "confirmed" || booking.status === "completed";
}

function countPendingPayments(bookings: Booking[]): number {
  return bookings.filter((booking) => {
    if (booking.status === "cancelled") return false;
    const amounts = resolveBookingAmounts(booking);
    if (amounts.due > 0) return true;
    return booking.paymentStatus === "pending" || booking.paymentStatus === "partial";
  }).length;
}

function sumConfirmedRevenue(bookings: Booking[]): number {
  return bookings
    .filter(isRevenueBooking)
    .reduce((sum, booking) => sum + booking.totalPriceUsd, 0);
}

function resolvePeriodBounds(period: AnalyticsPeriod): AnalyticsPeriodBounds {
  const to = new Date();
  to.setHours(23, 59, 59, 999);

  if (period === "all") {
    return {
      period,
      from: null,
      to: to.toISOString(),
      label: ANALYTICS_PERIOD_LABELS.all,
    };
  }

  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const from = new Date(to);
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);

  return {
    period,
    from: from.toISOString(),
    to: to.toISOString(),
    label: ANALYTICS_PERIOD_LABELS[period],
  };
}

function previousPeriodBounds(bounds: AnalyticsPeriodBounds): AnalyticsPeriodBounds | null {
  if (!bounds.from || bounds.period === "all") return null;
  const from = new Date(bounds.from);
  const to = new Date(bounds.from);
  to.setMilliseconds(to.getMilliseconds() - 1);
  const spanMs = new Date(bounds.to).getTime() - from.getTime();
  const prevFrom = new Date(from.getTime() - spanMs);
  return {
    period: bounds.period,
    from: prevFrom.toISOString(),
    to: to.toISOString(),
    label: "Предыдущий период",
  };
}

function bookingInBounds(
  booking: Booking,
  bounds: Pick<AnalyticsPeriodBounds, "from" | "to">
): boolean {
  const created = new Date(booking.createdAt);
  if (created > new Date(bounds.to)) return false;
  if (bounds.from && created < new Date(bounds.from)) return false;
  return true;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function buildTourMetaMap(userId: string): Map<string, TourMeta> {
  const map = new Map<string, TourMeta>();
  for (const listing of getOrganizerTourListingsForUser(userId)) {
    const slug = getCatalogSlug(listing);
    const draft = readOrganizerTourDraft(listing.id);
    map.set(slug, {
      tourSlug: slug,
      tourTitle: listing.title,
      isPrivate: draft?.isPrivate ?? listing.isPrivate ?? false,
      type: listing.type,
      region: draft?.touristRegions?.[0] ?? draft?.region ?? "Без региона",
      activityType: draft?.activityType ?? "Не указано",
    });
  }
  return map;
}

function metaForBooking(booking: Booking, metaMap: Map<string, TourMeta>): TourMeta {
  return (
    metaMap.get(booking.tourSlug) ?? {
      tourSlug: booking.tourSlug,
      tourTitle: booking.tourTitle,
      isPrivate: false,
      type: "tour",
      region: "Без региона",
      activityType: "Не указано",
    }
  );
}

function buildDailySeries(
  bookings: Booking[],
  bounds: AnalyticsPeriodBounds,
  mode: "count" | "revenue"
): AnalyticsDailyPoint[] {
  let fromIso = bounds.from;
  if (!fromIso) {
    if (bookings.length === 0) return [];
    const dates = bookings.map((b) => b.createdAt.slice(0, 10)).sort();
    fromIso = new Date(`${dates[0]}T00:00:00`).toISOString();
  }

  const from = new Date(fromIso);
  const to = new Date(bounds.to);
  const points: AnalyticsDailyPoint[] = [];
  const cursor = new Date(from);

  while (cursor <= to) {
    const key = cursor.toISOString().slice(0, 10);
    const dayBookings = bookings.filter((b) => b.createdAt.slice(0, 10) === key);
    const value =
      mode === "count"
        ? dayBookings.length
        : sumConfirmedRevenue(dayBookings);
    points.push({
      date: key,
      label: new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(cursor),
      value,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
}

function buildMonthlySeries(bookings: Booking[]): AnalyticsMonthlyPoint[] {
  const buckets = new Map<string, AnalyticsMonthlyPoint>();

  for (const booking of bookings) {
    const month = booking.createdAt.slice(0, 7);
    const existing = buckets.get(month) ?? {
      month,
      label: new Intl.DateTimeFormat("ru-RU", { month: "short", year: "numeric" }).format(
        new Date(`${month}-01`)
      ),
      bookings: 0,
      revenueUsd: 0,
    };
    existing.bookings += 1;
    if (isRevenueBooking(booking)) {
      existing.revenueUsd += booking.totalPriceUsd;
    }
    buckets.set(month, existing);
  }

  return [...buckets.values()].sort((a, b) => a.month.localeCompare(b.month));
}

function buildBreakdown(
  bookings: Booking[],
  metaMap: Map<string, TourMeta>,
  pickLabel: (meta: TourMeta) => string
): AnalyticsBreakdownRow[] {
  const buckets = new Map<string, { label: string; bookings: number; revenueUsd: number }>();
  const revenueTotal = sumConfirmedRevenue(bookings);

  for (const booking of bookings) {
    const meta = metaForBooking(booking, metaMap);
    const label = pickLabel(meta) || "Не указано";
    const id = label.toLowerCase().replace(/\s+/g, "-");
    const row = buckets.get(id) ?? { label, bookings: 0, revenueUsd: 0 };
    row.bookings += 1;
    if (isRevenueBooking(booking)) {
      row.revenueUsd += booking.totalPriceUsd;
    }
    buckets.set(id, row);
  }

  return [...buckets.values()]
    .map((row) => ({
      id: row.label,
      label: row.label,
      bookings: row.bookings,
      revenueUsd: row.revenueUsd,
      sharePct: revenueTotal > 0 ? Math.round((row.revenueUsd / revenueTotal) * 100) : 0,
    }))
    .sort((a, b) => b.revenueUsd - a.revenueUsd);
}

function buildTourPerformance(
  bookings: Booking[],
  waitlistBySlug: Map<string, number>,
  metaMap: Map<string, TourMeta>
): TourPerformanceRow[] {
  const rows = new Map<string, TourPerformanceRow>();

  for (const booking of bookings) {
    const meta = metaForBooking(booking, metaMap);
    const row =
      rows.get(meta.tourSlug) ??
      ({
        tourSlug: meta.tourSlug,
        tourTitle: meta.tourTitle,
        isPrivate: meta.isPrivate,
        type: meta.type,
        region: meta.region,
        activityType: meta.activityType,
        bookingsCount: 0,
        confirmedCount: 0,
        revenueUsd: 0,
        averageOrderValueUsd: null,
        totalGuests: 0,
        conversionRate: null,
        waitlistCount: waitlistBySlug.get(meta.tourSlug) ?? 0,
      } satisfies TourPerformanceRow);

    row.bookingsCount += 1;
    row.totalGuests += booking.guests;
    if (isRevenueBooking(booking)) {
      row.confirmedCount += 1;
      row.revenueUsd += booking.totalPriceUsd;
    }
    rows.set(meta.tourSlug, row);
  }

  for (const [slug, meta] of metaMap) {
    if (!rows.has(slug)) {
      rows.set(slug, {
        tourSlug: slug,
        tourTitle: meta.tourTitle,
        isPrivate: meta.isPrivate,
        type: meta.type,
        region: meta.region,
        activityType: meta.activityType,
        bookingsCount: 0,
        confirmedCount: 0,
        revenueUsd: 0,
        averageOrderValueUsd: null,
        totalGuests: 0,
        conversionRate: null,
        waitlistCount: waitlistBySlug.get(slug) ?? 0,
      });
    }
  }

  return [...rows.values()]
    .map((row) => {
      const nonCancelled = row.bookingsCount;
      const converted = row.confirmedCount;
      return {
        ...row,
        averageOrderValueUsd:
          converted > 0 ? Math.round(row.revenueUsd / converted) : null,
        conversionRate:
          nonCancelled > 0 ? Math.round((converted / nonCancelled) * 100) : null,
      };
    })
    .sort((a, b) => b.revenueUsd - a.revenueUsd);
}

function buildCustomerMetrics(bookings: Booking[]) {
  const byEmail = new Map<
    string,
    { contactName: string; bookingsCount: number; revenueUsd: number }
  >();

  for (const booking of bookings) {
    const email = booking.contactEmail.trim().toLowerCase();
    if (!email) continue;
    const row = byEmail.get(email) ?? {
      contactName: booking.contactName,
      bookingsCount: 0,
      revenueUsd: 0,
    };
    row.bookingsCount += 1;
    if (isRevenueBooking(booking)) {
      row.revenueUsd += booking.totalPriceUsd;
    }
    byEmail.set(email, row);
  }

  const topSpenders: CustomerSpenderRow[] = [...byEmail.entries()]
    .map(([contactEmail, row]) => ({
      contactEmail,
      contactName: row.contactName,
      bookingsCount: row.bookingsCount,
      revenueUsd: row.revenueUsd,
      isReturning: row.bookingsCount > 1,
    }))
    .sort((a, b) => b.revenueUsd - a.revenueUsd)
    .slice(0, 5);

  const actualReturning = [...byEmail.values()].filter((c) => c.bookingsCount > 1).length;

  const uniqueTotal = byEmail.size;

  const leadTimes = bookings
    .filter((b) => b.startDate)
    .map((b) => {
      const created = new Date(b.createdAt).getTime();
      const start = new Date(b.startDate!).getTime();
      return Math.max(0, Math.round((start - created) / 86400000));
    });

  return {
    uniqueTotal,
    returningCount: actualReturning,
    returningRatePct: uniqueTotal > 0 ? Math.round((actualReturning / uniqueTotal) * 100) : null,
    topSpenders,
    averageGuestsPerBooking: average(bookings.map((b) => b.guests)),
    averageLeadTimeDays: average(leadTimes),
  };
}

export function getOrganizerBasicAnalyticsReport(
  userId: string,
  period: AnalyticsPeriod = "30d"
): OrganizerBasicAnalyticsReport {
  const catalogSlugs = getOrganizerCatalogSlugs(userId);
  const allBookings = getOrganizerBookings(catalogSlugs);
  const bounds = resolvePeriodBounds(period);
  const bookings = allBookings.filter((b) => bookingInBounds(b, bounds));
  const bookingStats = getOrganizerBookingStats(catalogSlugs);
  const tours = getOrganizerTourListingsForUser(userId).filter((t) => !t.deleted);
  const waitlistStats = getOrganizerCabinetWaitlistStats(userId);
  const reviewsSummary = getOrganizerReviewsSummary(userId);

  const confirmed = bookings.filter(isRevenueBooking);
  const revenueUsd = sumConfirmedRevenue(bookings);
  const nonCancelled = bookings.filter((b) => b.status !== "cancelled");
  const converted = bookings.filter(isRevenueBooking);

  const funnel: OrganizerFunnelStats = {
    new: bookingStats.newCount,
    pending: bookingStats.pendingCount,
    confirmed: bookingStats.confirmedCount,
    completed: bookingStats.completedCount,
    cancelled: bookingStats.cancelledCount,
    total: allBookings.length,
  };

  const emails = new Set(
    bookings.map((b) => b.contactEmail.trim().toLowerCase()).filter(Boolean)
  );

  const trendDays = period === "7d" ? 7 : 14;
  const trendBounds: AnalyticsPeriodBounds = {
    ...bounds,
    from: new Date(Date.now() - (trendDays - 1) * 86400000).toISOString(),
  };

  return {
    period: bounds,
    kpis: {
      totalBookings: bookings.length,
      confirmedBookings: confirmed.length,
      revenueUsd,
      averageOrderValueUsd:
        confirmed.length > 0 ? Math.round(revenueUsd / confirmed.length) : null,
      uniqueCustomers: emails.size,
      publishedTours: tours.filter((t) => t.status === "published" && !t.archived).length,
      privateTours: tours.filter((t) => t.isPrivate && !t.archived).length,
      waitlistActive: waitlistStats.activeCount,
      conversionRate:
        nonCancelled.length > 0
          ? Math.round((converted.length / nonCancelled.length) * 100)
          : null,
      pendingPayments: countPendingPayments(allBookings),
    },
    funnel,
    recentTrend: buildDailySeries(bookings, trendBounds, "count"),
    reviewsSummary,
  };
}

export function getOrganizerAdvancedAnalyticsReport(
  userId: string,
  period: AnalyticsPeriod = "30d"
): OrganizerAdvancedAnalyticsReport {
  const catalogSlugs = getOrganizerCatalogSlugs(userId);
  const allBookings = getOrganizerBookings(catalogSlugs);
  const bounds = resolvePeriodBounds(period);
  const bookings = allBookings.filter((b) => bookingInBounds(b, bounds));
  const prevBounds = previousPeriodBounds(bounds);
  const prevBookings = prevBounds
    ? allBookings.filter((b) => bookingInBounds(b, prevBounds))
    : [];

  const metaMap = buildTourMetaMap(userId);
  const waitlistEntries = getOrganizerWaitlistEntries(catalogSlugs);
  const waitlistBySlug = new Map<string, number>();
  for (const entry of waitlistEntries) {
    waitlistBySlug.set(entry.tourSlug, (waitlistBySlug.get(entry.tourSlug) ?? 0) + 1);
  }

  const tourPerformance = buildTourPerformance(bookings, waitlistBySlug, metaMap);
  const customers = buildCustomerMetrics(bookings);
  const prevCustomers = buildCustomerMetrics(prevBookings);

  const visibilitySplit = {
    public: { bookings: 0, revenueUsd: 0, tours: 0 },
    private: { bookings: 0, revenueUsd: 0, tours: 0 },
  };

  for (const meta of metaMap.values()) {
    const bucket = meta.isPrivate ? visibilitySplit.private : visibilitySplit.public;
    bucket.tours += 1;
  }

  for (const booking of bookings) {
    const meta = metaForBooking(booking, metaMap);
    const bucket = meta.isPrivate ? visibilitySplit.private : visibilitySplit.public;
    bucket.bookings += 1;
    if (isRevenueBooking(booking)) {
      bucket.revenueUsd += booking.totalPriceUsd;
    }
  }

  let collectedUsd = 0;
  let outstandingUsd = 0;
  for (const booking of bookings) {
    if (booking.status === "cancelled") continue;
    const amounts = resolveBookingAmounts(booking);
    collectedUsd += amounts.paid;
    outstandingUsd += amounts.due;
  }

  const convertedWaitlist = waitlistEntries.filter((e) => e.status === "converted").length;

  return {
    period: bounds,
    growth: {
      bookingsChangePct: pctChange(bookings.length, prevBookings.length),
      revenueChangePct: pctChange(
        sumConfirmedRevenue(bookings),
        sumConfirmedRevenue(prevBookings)
      ),
      customersChangePct: pctChange(customers.uniqueTotal, prevCustomers.uniqueTotal),
    },
    timeSeries: {
      bookings: buildDailySeries(bookings, bounds, "count"),
      revenue: buildDailySeries(
        bookings.filter(isRevenueBooking),
        bounds,
        "revenue"
      ),
    },
    monthlySeries: buildMonthlySeries(allBookings),
    tourPerformance,
    topByBookings: [...tourPerformance].sort((a, b) => b.bookingsCount - a.bookingsCount).slice(0, 5),
    topByRevenue: tourPerformance.slice(0, 5),
    visibilitySplit,
    regions: buildBreakdown(bookings, metaMap, (m) => m.region),
    activities: buildBreakdown(bookings, metaMap, (m) => m.activityType),
    tourTypes: buildBreakdown(bookings, metaMap, (m) =>
      m.type === "excursion" ? "Экскурсии" : "Туры"
    ),
    customers,
    waitlist: {
      totalEntries: waitlistEntries.length,
      convertedCount: convertedWaitlist,
      conversionRatePct:
        waitlistEntries.length > 0
          ? Math.round((convertedWaitlist / waitlistEntries.length) * 100)
          : null,
      activeCount: waitlistEntries.filter(
        (e) => e.status === "waiting" || e.status === "contacted" || e.status === "offered"
      ).length,
    },
    payments: {
      collectedUsd,
      outstandingUsd,
    },
  };
}

/** @deprecated Используйте getOrganizerBasicAnalyticsReport — сохранено для совместимости. */
export function getOrganizerAnalytics(userId: string): OrganizerAnalytics {
  const basic = getOrganizerBasicAnalyticsReport(userId, "all");
  const catalogSlugs = getOrganizerCatalogSlugs(userId);
  const bookingStats = getOrganizerBookingStats(catalogSlugs);
  const tours = getOrganizerTourListingsForUser(userId).filter((t) => !t.deleted);
  const allBookings = getOrganizerBookings(catalogSlugs);
  const reviewsSummary = getOrganizerReviewsSummary(userId);

  const nonCancelled = allBookings.filter((b) => b.status !== "cancelled");
  const confirmed = nonCancelled.filter(isRevenueBooking);
  const paid = nonCancelled.filter(
    (b) => b.paymentStatus === "paid" || b.paymentStatus === "partial"
  );

  const pct = (part: number, whole: number) =>
    whole > 0 ? Math.round((part / whole) * 100) : null;

  return {
    bookingStats,
    funnel: basic.funnel,
    revenueUsd: basic.kpis.revenueUsd,
    pendingPaymentsCount: basic.kpis.pendingPayments,
    publishedToursCount: basic.kpis.publishedTours,
    draftToursCount: tours.filter((t) => t.status === "draft" && !t.archived).length,
    archivedToursCount: tours.filter((t) => t.archived).length,
    conversionRate: basic.kpis.conversionRate,
    conversionFunnel: {
      started: nonCancelled.length,
      confirmed: confirmed.length,
      paid: paid.length,
      reviewed: reviewsSummary.count,
      bookingToConfirmedPct: pct(confirmed.length, nonCancelled.length),
      bookingToPaidPct: pct(paid.length, nonCancelled.length),
      bookingToReviewPct: pct(reviewsSummary.count, nonCancelled.length),
    },
  };
}
