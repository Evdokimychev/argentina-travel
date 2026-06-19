import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  ANALYTICS_PERIOD_LABELS,
  type AnalyticsPeriod,
  type AnalyticsPeriodBounds,
  type OrganizerAnalyticsServerReport,
  type OrganizerAnalyticsTopTourRow,
} from "@/types/organizer-analytics";

type DbClient = SupabaseClient<Database>;

const MAX_ROWS = 5000;

function parseNumber(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return numeric;
}

function csvEscape(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function isRevenueBookingStatus(status: string): boolean {
  return status === "confirmed" || status === "completed";
}

function isPaidBookingStatus(status: string | null): boolean {
  return status === "paid" || status === "partial";
}

function isCompletedChargeStatus(status: string): boolean {
  return status === "completed" || status === "paid" || status === "succeeded";
}

function computeRate(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 1000) / 10;
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

  const days =
    period === "7d"
      ? 7
      : period === "30d"
        ? 30
        : period === "90d"
          ? 90
          : 365;
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

export function parseOrganizerAnalyticsPeriod(
  value: string | null | undefined
): AnalyticsPeriod {
  if (
    value === "7d" ||
    value === "30d" ||
    value === "90d" ||
    value === "365d" ||
    value === "all"
  ) {
    return value;
  }
  return "30d";
}

type OrganizerEventType = "tour_view" | "booking_started";

async function countOrganizerEvents(
  supabase: DbClient,
  organizerUserId: string,
  eventType: OrganizerEventType,
  periodFrom: string | null
): Promise<number> {
  const toursQuery = supabase
    .from("tours")
    .select("slug")
    .eq("owner_user_id", organizerUserId)
    .limit(MAX_ROWS);
  const { data: tours, error: toursError } = await toursQuery;
  if (toursError || !tours || tours.length === 0) return 0;

  const slugs = tours
    .map((tour) => tour.slug)
    .filter((slug): slug is string => typeof slug === "string" && slug.trim().length > 0);
  if (slugs.length === 0) return 0;

  let query = supabase
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", eventType)
    .in("tour_slug", slugs);

  if (periodFrom) {
    query = query.gte("created_at", periodFrom);
  }

  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

function aggregateTopTours(input: {
  bookings: Array<{
    id: string;
    tour_slug: string;
    tour_title: string;
    status: string;
    payment_status: string | null;
  }>;
  revenueByBookingId: Map<string, number>;
  paidBookingIds: Set<string>;
}): OrganizerAnalyticsTopTourRow[] {
  const byTour = new Map<string, OrganizerAnalyticsTopTourRow>();

  for (const booking of input.bookings) {
    const slug = booking.tour_slug || "without-slug";
    const row = byTour.get(slug) ?? {
      tourSlug: slug,
      tourTitle: booking.tour_title || "Без названия",
      bookingsCount: 0,
      confirmedBookingsCount: 0,
      paidBookingsCount: 0,
      revenueUsd: 0,
      conversionRatePct: null,
    };

    row.bookingsCount += 1;
    if (isRevenueBookingStatus(booking.status)) {
      row.confirmedBookingsCount += 1;
    }
    if (
      input.paidBookingIds.has(booking.id) ||
      isPaidBookingStatus(booking.payment_status)
    ) {
      row.paidBookingsCount += 1;
    }
    row.revenueUsd += input.revenueByBookingId.get(booking.id) ?? 0;

    byTour.set(slug, row);
  }

  return [...byTour.values()]
    .map((row) => ({
      ...row,
      conversionRatePct: computeRate(row.confirmedBookingsCount, row.bookingsCount),
    }))
    .sort((a, b) => {
      if (b.revenueUsd !== a.revenueUsd) return b.revenueUsd - a.revenueUsd;
      return b.bookingsCount - a.bookingsCount;
    })
    .slice(0, 10);
}

export async function getOrganizerAnalyticsServerReport(
  supabase: DbClient,
  organizerUserId: string,
  period: AnalyticsPeriod
): Promise<OrganizerAnalyticsServerReport> {
  const bounds = resolvePeriodBounds(period);

  let bookingsQuery = supabase
    .from("bookings")
    .select(
      "id,tour_slug,tour_title,status,payment_status,total_price_usd,contact_email,created_at"
    )
    .eq("organizer_user_id", organizerUserId)
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);
  if (bounds.from) {
    bookingsQuery = bookingsQuery.gte("created_at", bounds.from);
  }
  const { data: bookingsData, error: bookingsError } = await bookingsQuery;
  if (bookingsError) {
    throw new Error("Не удалось загрузить бронирования для аналитики");
  }
  const bookings = bookingsData ?? [];

  const bookingIds = bookings.map((booking) => booking.id);
  const revenueByBookingId = new Map<string, number>();
  const paidBookingIds = new Set<string>();

  if (bookingIds.length > 0) {
    const { data: transactionsData, error: transactionsError } = await supabase
      .from("payment_transactions")
      .select("booking_id,status,type,amount")
      .in("booking_id", bookingIds)
      .eq("type", "charge")
      .limit(MAX_ROWS);

    if (transactionsError) {
      throw new Error("Не удалось загрузить платежные транзакции для аналитики");
    }

    const transactions = transactionsData ?? [];
    for (const tx of transactions) {
      if (!isCompletedChargeStatus(tx.status)) continue;
      paidBookingIds.add(tx.booking_id);
      revenueByBookingId.set(
        tx.booking_id,
        (revenueByBookingId.get(tx.booking_id) ?? 0) + parseNumber(tx.amount)
      );
    }
  }

  const confirmedBookingsCount = bookings.filter((booking) =>
    isRevenueBookingStatus(booking.status)
  ).length;

  for (const booking of bookings) {
    if (revenueByBookingId.has(booking.id)) continue;
    if (isRevenueBookingStatus(booking.status)) {
      revenueByBookingId.set(booking.id, parseNumber(booking.total_price_usd));
    }
  }

  const revenueUsd = [...revenueByBookingId.values()].reduce((sum, value) => sum + value, 0);
  const paidBookingsCount = bookings.filter(
    (booking) =>
      paidBookingIds.has(booking.id) || isPaidBookingStatus(booking.payment_status)
  ).length;
  const uniqueCustomers = new Set(
    bookings
      .map((booking) => booking.contact_email?.trim().toLowerCase() ?? "")
      .filter((email) => email.length > 0)
  ).size;

  const [tourViews, bookingStartsEventCount] = await Promise.all([
    countOrganizerEvents(supabase, organizerUserId, "tour_view", bounds.from),
    countOrganizerEvents(supabase, organizerUserId, "booking_started", bounds.from),
  ]);

  const bookingStarts = Math.max(bookingStartsEventCount, bookings.length);
  const funnelViews = Math.max(tourViews, bookingStarts);
  const topTours = aggregateTopTours({
    bookings: bookings.map((booking) => ({
      id: booking.id,
      tour_slug: booking.tour_slug,
      tour_title: booking.tour_title,
      status: booking.status,
      payment_status: booking.payment_status,
    })),
    revenueByBookingId,
    paidBookingIds,
  });

  return {
    period: bounds,
    generatedAt: new Date().toISOString(),
    summary: {
      bookingsCount: bookings.length,
      confirmedBookingsCount,
      paidBookingsCount,
      revenueUsd,
      averageOrderValueUsd:
        confirmedBookingsCount > 0
          ? Math.round((revenueUsd / confirmedBookingsCount) * 100) / 100
          : null,
      uniqueCustomers,
    },
    funnel: {
      tourViews: funnelViews,
      bookingStarts,
      confirmedBookings: confirmedBookingsCount,
      paidBookings: paidBookingsCount,
      viewToStartPct: computeRate(bookingStarts, funnelViews),
      startToConfirmedPct: computeRate(confirmedBookingsCount, bookingStarts),
      confirmedToPaidPct: computeRate(paidBookingsCount, confirmedBookingsCount),
    },
    topTours,
  };
}

export function organizerAnalyticsFilename(period: AnalyticsPeriod): string {
  const date = new Date().toISOString().slice(0, 10);
  return `organizer-analytics-${period}-${date}.csv`;
}

export function buildOrganizerAnalyticsCsv(report: OrganizerAnalyticsServerReport): string {
  const lines = [
    "показатель,значение",
    ["Период", report.period.label].map(csvEscape).join(","),
    ["Сформировано", report.generatedAt].map(csvEscape).join(","),
    ["Бронирования", report.summary.bookingsCount].map(csvEscape).join(","),
    ["Подтверждённые", report.summary.confirmedBookingsCount].map(csvEscape).join(","),
    ["Оплаченные", report.summary.paidBookingsCount].map(csvEscape).join(","),
    ["Выручка USD", report.summary.revenueUsd.toFixed(2)].map(csvEscape).join(","),
    [
      "Средний чек USD",
      report.summary.averageOrderValueUsd != null
        ? report.summary.averageOrderValueUsd.toFixed(2)
        : "",
    ]
      .map(csvEscape)
      .join(","),
    ["Уникальные клиенты", report.summary.uniqueCustomers].map(csvEscape).join(","),
    ["Просмотры туров", report.funnel.tourViews].map(csvEscape).join(","),
    ["Начатые бронирования", report.funnel.bookingStarts].map(csvEscape).join(","),
    ["Конверсия просмотр->старт (%)", report.funnel.viewToStartPct ?? ""]
      .map(csvEscape)
      .join(","),
    ["Конверсия старт->подтверждение (%)", report.funnel.startToConfirmedPct ?? ""]
      .map(csvEscape)
      .join(","),
    ["Конверсия подтверждение->оплата (%)", report.funnel.confirmedToPaidPct ?? ""]
      .map(csvEscape)
      .join(","),
    "",
    [
      "tour_slug",
      "tour_title",
      "bookings_count",
      "confirmed_bookings_count",
      "paid_bookings_count",
      "revenue_usd",
      "conversion_rate_pct",
    ].join(","),
  ];

  for (const row of report.topTours) {
    lines.push(
      [
        csvEscape(row.tourSlug),
        csvEscape(row.tourTitle),
        csvEscape(row.bookingsCount),
        csvEscape(row.confirmedBookingsCount),
        csvEscape(row.paidBookingsCount),
        csvEscape(row.revenueUsd.toFixed(2)),
        csvEscape(row.conversionRatePct ?? ""),
      ].join(",")
    );
  }

  return lines.join("\n");
}
