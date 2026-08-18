import type { ProductModuleId } from "@/lib/modules/registry";

/**
 * Sprint 7 product-scope contract — derived from code defaults, launch guards,
 * and Sprint 5 commercial model (not roadmap prose).
 */
export type BusinessStatus =
  | "CORE"
  | "SUPPORTING"
  | "EXPERIMENTAL"
  | "POST_LAUNCH"
  | "DORMANT"
  | "LEGACY";

export type RuntimeStatus =
  | "ACTIVE"
  | "HIDDEN"
  | "DISABLED"
  | "INTERNAL_ONLY"
  | "REMOVABLE";

export type ModuleLifecycleRecord = {
  id: ProductModuleId | string;
  purpose: string;
  businessStatus: BusinessStatus;
  runtimeStatus: RuntimeStatus;
  owner: string;
  removalCondition: string | null;
  /** HTTP / cron / webhook / bundle side effects while “hidden”. */
  dormantCostNotes: string;
};

export const MODULE_LIFECYCLE: readonly ModuleLifecycleRecord[] = [
  {
    id: "home",
    purpose: "Public portal entry",
    businessStatus: "CORE",
    runtimeStatus: "ACTIVE",
    owner: "portal",
    removalCondition: null,
    dormantCostNotes: "n/a",
  },
  {
    id: "tours",
    purpose: "Marketplace tours + booking/affiliate handoff",
    businessStatus: "CORE",
    runtimeStatus: "ACTIVE",
    owner: "marketplace",
    removalCondition: null,
    dormantCostNotes: "n/a",
  },
  {
    id: "excursions",
    purpose: "Partner excursions catalog",
    businessStatus: "CORE",
    runtimeStatus: "ACTIVE",
    owner: "marketplace",
    removalCondition: null,
    dormantCostNotes: "n/a",
  },
  {
    id: "guide",
    purpose: "Editorial guide",
    businessStatus: "CORE",
    runtimeStatus: "ACTIVE",
    owner: "content-os",
    removalCondition: null,
    dormantCostNotes: "n/a",
  },
  {
    id: "journal",
    purpose: "Blog / journal",
    businessStatus: "CORE",
    runtimeStatus: "ACTIVE",
    owner: "content-os",
    removalCondition: null,
    dormantCostNotes: "n/a",
  },
  {
    id: "knowledgeBase",
    purpose: "Knowledge base",
    businessStatus: "CORE",
    runtimeStatus: "ACTIVE",
    owner: "content-os",
    removalCondition: null,
    dormantCostNotes: "n/a",
  },
  {
    id: "destinations",
    purpose: "Destination landings",
    businessStatus: "CORE",
    runtimeStatus: "ACTIVE",
    owner: "geography",
    removalCondition: null,
    dormantCostNotes: "n/a",
  },
  {
    id: "places",
    purpose: "Places + map geography",
    businessStatus: "CORE",
    runtimeStatus: "ACTIVE",
    owner: "geography",
    removalCondition: null,
    dormantCostNotes: "n/a",
  },
  {
    id: "bookings",
    purpose: "Native booking CRM path",
    businessStatus: "CORE",
    runtimeStatus: "ACTIVE",
    owner: "booking",
    removalCondition: null,
    dormantCostNotes: "n/a",
  },
  {
    id: "forum",
    purpose: "Community forum (not launch-ready)",
    businessStatus: "DORMANT",
    runtimeStatus: "DISABLED",
    owner: "community",
    removalCondition: "Inventory ready + PUBLIC_LAUNCH_SHOW_UNFINISHED intentional preview, or archive APIs after zero traffic evidence.",
    dormantCostNotes:
      "Pages 404 via launch guards; public APIs quarantine via launch-guarded control plane (Sprint 7). No cron/webhooks. Admin forum surfaces retained.",
  },
  {
    id: "shop",
    purpose: "Digital shop (not launch-ready)",
    businessStatus: "DORMANT",
    runtimeStatus: "DISABLED",
    owner: "commerce",
    removalCondition: "Published inventory + payments policy, or archive order APIs.",
    dormantCostNotes:
      "Pages unpublished; order APIs quarantine on control plane. No shop cron. Admin retained.",
  },
  {
    id: "carRental",
    purpose: "Car rental vertical",
    businessStatus: "DORMANT",
    runtimeStatus: "DISABLED",
    owner: "mobility",
    removalCondition: "Partner contract + mode != disabled in production settings.",
    dormantCostNotes: "Public page 404 when mode disabled; mobility APIs use resolveMobilityModuleAccess.",
  },
  {
    id: "transfers",
    purpose: "Transfers vertical",
    businessStatus: "DORMANT",
    runtimeStatus: "DISABLED",
    owner: "mobility",
    removalCondition: "Partner contract + mode != disabled.",
    dormantCostNotes: "enforcePublicModuleAccess on search/autocomplete + affiliate transfers.",
  },
  {
    id: "hotels",
    purpose: "Hotels vertical (planned)",
    businessStatus: "POST_LAUNCH",
    runtimeStatus: "DISABLED",
    owner: "mobility",
    removalCondition: "Product decision to build /hotels.",
    dormantCostNotes: "No App Router page; admin preview only.",
  },
  {
    id: "apartments",
    purpose: "Apartments — request lead vs native catalog",
    businessStatus: "POST_LAUNCH",
    runtimeStatus: "HIDDEN",
    owner: "mobility",
    removalCondition: "native_request mode enabled with catalog SLA, or drop native path.",
    dormantCostNotes:
      "Default apartmentsMode=request: services card → /contacts; /apartments catalog requires native_request (intentional).",
  },
  {
    id: "ownPayment",
    purpose: "Own online payment (Stripe/MP) — deferred commercial mode",
    businessStatus: "POST_LAUNCH",
    runtimeStatus: "DISABLED",
    owner: "commerce",
    removalCondition: "Owner selects production provider and flips productionEnabled.",
    dormantCostNotes:
      "create_payment_link + Stripe/MP session gated; webhooks + expire-unpaid retained for continuity. Sandbox probe ANDs with gate.",
  },
  {
    id: "organizer",
    purpose: "Organizer cabinet + public organizer profiles",
    businessStatus: "CORE",
    runtimeStatus: "ACTIVE",
    owner: "organizer",
    removalCondition: null,
    dormantCostNotes: "n/a — CORE marketplace supply side even if acquisition not promoted.",
  },
  {
    id: "routeBuilder",
    purpose: "Podbor quiz UX (client matcher)",
    businessStatus: "EXPERIMENTAL",
    runtimeStatus: "ACTIVE",
    owner: "discovery",
    removalCondition: "If unused in analytics for 90d after launch, freeze page behind flag.",
    dormantCostNotes: "/podbor quiz is client-side; /api/podbor/narrative frozen (410).",
  },
  {
    id: "guideAssistant",
    purpose: "Guide content Q&A widget",
    businessStatus: "EXPERIMENTAL",
    runtimeStatus: "ACTIVE",
    owner: "discovery",
    removalCondition: "If unused, hide widget; keep RAG service for future.",
    dormantCostNotes: "/api/assistant/ask — separate from tour-match and recommendations.",
  },
  {
    id: "tourMatchAi",
    purpose: "Podbor chat tour-match",
    businessStatus: "EXPERIMENTAL",
    runtimeStatus: "ACTIVE",
    owner: "discovery",
    removalCondition: "Consolidate scorers with quiz if one UX wins.",
    dormantCostNotes: "/api/ai/tour-match tours-gated.",
  },
  {
    id: "recommendations",
    purpose: "Personalized catalog ranking (non-LLM)",
    businessStatus: "SUPPORTING",
    runtimeStatus: "ACTIVE",
    owner: "discovery",
    removalCondition: null,
    dormantCostNotes: "/api/recommendations + homepage SSR — not AI assistant.",
  },
  {
    id: "quickExplore",
    purpose: "Map quick-explore payload",
    businessStatus: "SUPPORTING",
    runtimeStatus: "ACTIVE",
    owner: "geography",
    removalCondition: null,
    dormantCostNotes: "/api/quick-explore — geo BFF, not AI.",
  },
  {
    id: "immigration",
    purpose: "Immigration editorial",
    businessStatus: "SUPPORTING",
    runtimeStatus: "HIDDEN",
    owner: "content-os",
    removalCondition: null,
    dormantCostNotes: "Direct URL allowed; nav/search off by launch guard.",
  },
] as const;
