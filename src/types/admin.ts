/**
 * Admin panel capabilities and navigation types (Phase E).
 */
import type { AnalyticsPeriod, DailyCountPoint } from "@/types/admin-analytics";

/** Runtime allowlist used by admin APIs; wildcard grants all capabilities. */
export const ADMIN_CAPABILITIES = [
  "*",
  "dashboard.view",
  "operations.leads",
  "operations.bookings",
  "operations.shop",
  "operations.email",
  "finance.view",
  "finance.refunds.prepare",
  "finance.refunds.approve",
  "finance.payouts.create",
  "finance.payouts.approve",
  "finance.payouts.export",
  "finance.payouts.complete",
  "finance.reconciliation",
  "marketplace.tours",
  "marketplace.excursions",
  "marketplace.moderation",
  "content.edit",
  "content.publish",
  "users.view",
  "users.manage",
  "analytics.view",
  "system.settings",
  "system.audit",
  "sources.view",
  "sources.create",
  "sources.edit",
  "sources.enable",
  "sources.disable",
  "sources.run",
  "sources.delete",
  "source_credentials.manage",
  "ingestion_runs.view",
  "ingestion_runs.retry",
  "processing_queue.view",
  "processing_queue.manage",
  "moderation.view",
  "moderation.approve",
  "moderation.reject",
  "moderation.publish",
  "prompts.view",
  "prompts.manage",
  "system_ingestion.manage",
  "ingestion_audit.view",
] as const;

export type AdminCapability = (typeof ADMIN_CAPABILITIES)[number];

export const ADMIN_PRESET_IDS = [
  "super_admin",
  "operations_manager",
  "marketplace_manager",
  "content_editor",
  "support_agent",
  "finance_operator",
  "finance_approver",
] as const;

export type AdminPresetId = (typeof ADMIN_PRESET_IDS)[number];

export type AdminNavSectionId =
  | "dashboard"
  | "operations"
  | "marketplace"
  | "content"
  | "ingestion"
  | "marketing"
  | "users"
  | "analytics"
  | "system";

export type AdminNavItemId =
  | "dashboard"
  | "operations-hub"
  | "operations-leads"
  | "operations-bookings"
  | "operations-waitlist"
  | "operations-email"
  | "operations-communications-commerce"
  | "operations-privacy"
  | "operations-payments"
  | "operations-reconciliation"
  | "operations-shop"
  | "marketplace-tours"
  | "marketplace-apartments"
  | "marketplace-mobility"
  | "marketplace-excursions"
  | "marketplace-organizers"
  | "marketplace-experts"
  | "marketplace-moderation"
  | "content-documents"
  | "content-knowledge"
  | "content-forum"
  | "content-shop"
  | "content-map"
  | "content-media"
  | "content-social-feed"
  | "content-translations"
  | "content-freshness"
  | "ingestion-overview"
  | "ingestion-sources"
  | "ingestion-runs"
  | "ingestion-moderation"
  | "ingestion-prompts"
  | "users-list"
  | "analytics-overview"
  | "analytics-funnels"
  | "marketing-search-visibility"
  | "marketing-content-factory"
  | "marketing-email-templates"
  | "system-redirects"
  | "system-settings"
  | "system-commercial-plans"
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
