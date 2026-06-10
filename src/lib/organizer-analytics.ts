import { getOrganizerBookings, getOrganizerBookingStats } from "@/lib/bookings-store";
import { resolveBookingAmounts } from "@/lib/booking-payment-display";
import { getOrganizerCatalogSlugs } from "@/lib/organizer-bookings";
import { getOrganizerTourListingsForUser } from "@/lib/organizer-tour-store";
import type { OrganizerBookingStats } from "@/types/tourist";

export interface OrganizerFunnelStats {
  new: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  total: number;
}

export interface OrganizerAnalytics {
  bookingStats: OrganizerBookingStats;
  funnel: OrganizerFunnelStats;
  revenueUsd: number;
  pendingPaymentsCount: number;
  publishedToursCount: number;
  draftToursCount: number;
  archivedToursCount: number;
  conversionRate: number | null;
}

function countPendingPayments(bookings: ReturnType<typeof getOrganizerBookings>): number {
  return bookings.filter((booking) => {
    if (booking.status === "cancelled") return false;
    const amounts = resolveBookingAmounts(booking);
    if (amounts.due > 0) return true;
    return booking.paymentStatus === "pending" || booking.paymentStatus === "partial";
  }).length;
}

function sumConfirmedRevenue(bookings: ReturnType<typeof getOrganizerBookings>): number {
  return bookings
    .filter((booking) => booking.status === "confirmed" || booking.status === "completed")
    .reduce((sum, booking) => sum + booking.totalPriceUsd, 0);
}

export function getOrganizerAnalytics(userId: string): OrganizerAnalytics {
  const catalogSlugs = getOrganizerCatalogSlugs(userId);
  const bookings = getOrganizerBookings(catalogSlugs);
  const bookingStats = getOrganizerBookingStats(catalogSlugs);
  const tours = getOrganizerTourListingsForUser(userId).filter((tour) => !tour.deleted);

  const funnel: OrganizerFunnelStats = {
    new: bookingStats.newCount,
    pending: bookingStats.pendingCount,
    confirmed: bookingStats.confirmedCount,
    completed: bookingStats.completedCount,
    cancelled: bookingStats.cancelledCount,
    total: bookings.length,
  };

  const nonCancelled = funnel.total - funnel.cancelled;
  const converted = funnel.confirmed + funnel.completed;
  const conversionRate =
    nonCancelled > 0 ? Math.round((converted / nonCancelled) * 100) : null;

  return {
    bookingStats,
    funnel,
    revenueUsd: sumConfirmedRevenue(bookings),
    pendingPaymentsCount: countPendingPayments(bookings),
    publishedToursCount: tours.filter((tour) => tour.status === "published" && !tour.archived)
      .length,
    draftToursCount: tours.filter((tour) => tour.status === "draft" && !tour.archived).length,
    archivedToursCount: tours.filter((tour) => tour.archived).length,
    conversionRate,
  };
}
