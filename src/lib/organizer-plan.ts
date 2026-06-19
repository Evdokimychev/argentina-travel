import { shouldSeedDemoData } from "@/lib/demo-mode";
import {
  ORGANIZER_PLAN_STORE_KEY,
  ORGANIZER_PLAN_UPDATED_EVENT,
  ORGANIZER_PLANS,
  type OrganizerPlanDefinition,
  type OrganizerPlanTier,
} from "@/types/organizer-plan";
import { DEFAULT_ORGANIZER_OWNER_ID } from "@/types/user";

function notifyPlanUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ORGANIZER_PLAN_UPDATED_EVENT));
  }
}

function readStoredPlanTier(userId: string): OrganizerPlanTier | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ORGANIZER_PLAN_STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, OrganizerPlanTier>;
    const tier = parsed[userId];
    if (tier && tier in ORGANIZER_PLANS) return tier;
  } catch {
    // ignore
  }
  return null;
}

function writeStoredPlanTier(userId: string, tier: OrganizerPlanTier) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(ORGANIZER_PLAN_STORE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, OrganizerPlanTier>) : {};
    parsed[userId] = tier;
    window.localStorage.setItem(ORGANIZER_PLAN_STORE_KEY, JSON.stringify(parsed));
    notifyPlanUpdated();
  } catch {
    // ignore
  }
}

function defaultPlanTierForUser(userId: string): OrganizerPlanTier {
  if (shouldSeedDemoData() && userId === DEFAULT_ORGANIZER_OWNER_ID) {
    return "pro";
  }
  return "starter";
}

export function getOrganizerPlanTier(userId: string): OrganizerPlanTier {
  return readStoredPlanTier(userId) ?? defaultPlanTierForUser(userId);
}

export function getOrganizerPlan(userId: string): OrganizerPlanDefinition {
  return ORGANIZER_PLANS[getOrganizerPlanTier(userId)];
}

export function organizerHasAdvancedAnalytics(userId: string): boolean {
  return getOrganizerPlan(userId).advancedAnalytics;
}

/** Демо: переключение тарифа в кабинете (до интеграции биллинга). */
export function setOrganizerPlanTierDemo(
  userId: string,
  tier: OrganizerPlanTier
): OrganizerPlanDefinition {
  writeStoredPlanTier(userId, tier);
  return ORGANIZER_PLANS[tier];
}
