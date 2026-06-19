/**
 * Admin panel capabilities and navigation types (Phase E).
 */
import type { AnalyticsPeriod, DailyCountPoint } from "@/types/admin-analytics";

/** Wildcard grants all capabilities. */
export type AdminCapability =
  | "*"
  | "dashboard.view"
  | "operations.leads"
  | "operations.bookings"
  | "operations.shop"
  | "marketplace.tours"
  | "marketplace.excursions"
  | "marketplace.moderation"
  | "content.edit"
  | "content.publish"
  | "users.view"
  | "users.manage"
  | "analytics.view"
  | "system.settings"
  | "system.audit";

export type AdminPresetId =
  | "super_admin"
  | "operations_manager"
  | "marketplace_manager"
  | "content_editor"
  | "support_agent";

export type AdminNavSectionId =
  | "dashboard"
  | "operations"
  | "marketplace"
  | "content"
  | "users"
  | "analytics"
  | "system";

export type AdminNavItemId =
  | "dashboard"
  | "operations-hub"
  | "operations-leads"
  | "operations-bookings"
  | "operations-privacy"
  | "operations-payments"
  | "operations-reconciliation"
  | "operations-shop"
  | "marketplace-tours"
  | "marketplace-excursions"
  | "marketplace-moderation"
  | "content-documents"
  | "content-freshness"
  | "users-list"
  | "analytics-overview"
  | "analytics-funnels"
  | "system-settings"
  | "system-feature-flags"
  | "system-api-keys"
  | "system-staff"
  | "system-audit";

export interface AdminNavItem {
  id: AdminNavItemId;
  section: AdminNavSectionId;
  href: string;
  label: string;
  description?: string;
  capability: AdminCapability;
  /** Hide until module is implemented */
  comingSoon?: boolean;
}

export interface AdminSessionPayload {
  userId: string;
  capabilities: AdminCapability[];
  preset: AdminPresetId | null;
  via: "session";
}

export interface AdminDashboardSummary {
  newsletterCount: number;
  contactCount: number;
  shopOrderCount: number;
  tourCount: number;
  pendingModerationCount: number;
  excursionExperienceCount: number;
  bookingCount: number;
}

export interface AdminDashboardWidgets {
  period: AnalyticsPeriod;
  periodStart: string | null;
  generatedAt: string;
  totals: {
    newBookings: number;
    newLeads: number;
    shopOrders: number;
    pendingModeration: number;
    bookingRevenueUsd: number;
  };
  trends: {
    bookingsByDay: DailyCountPoint[];
    leadsByDay: DailyCountPoint[];
  };
}

export interface AdminHealthSnippet {
  ok: boolean;
  status: "ok" | "degraded";
  generatedAt: string;
  checks: {
    database: boolean;
    rls: boolean;
    sync: boolean;
  };
}

export interface AdminOperationsSummary {
  generatedAt: string;
  moderation: {
    pendingCount: number;
    oldestPendingCreatedAt: string | null;
    oldestPendingAgeMinutes: number | null;
  };
  leads: {
    newLast24h: number;
  };
  notifications: {
    unreadCount: number;
  };
  payments: {
    pendingOrPartialCount: number;
  };
  organizerApplications: {
    pendingCount: number;
  };
  health: AdminHealthSnippet;
}

/** Legacy capability aliases — map to new granular keys in API guards. */
export const LEGACY_CAPABILITY_MAP: Record<string, AdminCapability> = {
  moderate_tours: "marketplace.moderation",
  moderate_reviews: "marketplace.moderation",
  manage_users: "users.manage",
  view_analytics: "analytics.view",
};
