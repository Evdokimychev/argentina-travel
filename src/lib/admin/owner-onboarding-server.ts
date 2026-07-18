import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { hasAdminCapability } from "@/lib/admin/capabilities";
import {
  getIntegrationReadiness,
  type IntegrationReadinessItem,
} from "@/lib/integrations/admin-readiness";
import { readOpsStatusSnapshot, type OpsStatusSnapshot } from "@/lib/ops/ops-status";
import type { AdminCapability } from "@/types/admin";
import type { Database, Json } from "@/types/database";

type DbClient = SupabaseClient<Database>;

export type OwnerOnboardingItemStatus = "complete" | "attention" | "unavailable";

export type OwnerOnboardingItem = {
  id:
    | "site_identity"
    | "site_modules"
    | "tour_catalog"
    | "published_content"
    | "admin_team"
    | "critical_integrations"
    | "backup";
  title: string;
  description: string;
  fact: string;
  status: OwnerOnboardingItemStatus;
  href: string;
  linkLabel: string;
  requiredCapability: AdminCapability;
};

export type OwnerOnboardingSnapshot = {
  generatedAt: string;
  items: OwnerOnboardingItem[];
};

type IntegrationAuditRow = {
  entity_id: string | null;
  payload: Json;
  created_at: string;
};

type OwnerOnboardingDependencies = {
  getIntegrations: () => IntegrationReadinessItem[];
  readOps: () => OpsStatusSnapshot;
  now: () => number;
};

const DEFAULT_DEPENDENCIES: OwnerOnboardingDependencies = {
  getIntegrations: getIntegrationReadiness,
  readOps: readOpsStatusSnapshot,
  now: Date.now,
};

const CRITICAL_INTEGRATION_IDS = [
  "supabase",
  "email",
  "mercadopago",
  "stripe",
  "sentry",
] as const;
const INTEGRATION_VERIFICATION_MAX_AGE_MS = 30 * 24 * 60 * 60_000;

function unavailableItem(
  item: Omit<OwnerOnboardingItem, "status" | "fact">,
): OwnerOnboardingItem {
  return { ...item, status: "unavailable", fact: "Нет данных — повторите проверку позже" };
}

function countItem(
  item: Omit<OwnerOnboardingItem, "status" | "fact">,
  result: { count: number | null; error: unknown },
  labels: { empty: string; filled: (count: number) => string },
): OwnerOnboardingItem {
  if (result.error || typeof result.count !== "number") return unavailableItem(item);
  return result.count > 0
    ? { ...item, status: "complete", fact: labels.filled(result.count) }
    : { ...item, status: "attention", fact: labels.empty };
}

function payloadStatus(payload: Json): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const status = payload.status;
  return typeof status === "string" ? status : null;
}

function objectValue(value: Json): Record<string, Json | undefined> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function isConfigured(item: IntegrationReadinessItem | undefined): boolean {
  return item?.status === "configured" || item?.status === "ready" || item?.status === "built_in";
}

function integrationItem(
  auditResult: { data: IntegrationAuditRow[] | null; error: unknown },
  dependencies: OwnerOnboardingDependencies,
): OwnerOnboardingItem {
  const base = {
    id: "critical_integrations" as const,
    title: "Проверьте критичные подключения",
    description: "Ключей недостаточно: рабочее соединение должно быть недавно подтверждено.",
    href: "/admin/system/settings",
    linkLabel: "Открыть интеграции",
    requiredCapability: "system.settings" as const,
  };
  if (auditResult.error || !Array.isArray(auditResult.data)) return unavailableItem(base);

  let readiness: IntegrationReadinessItem[];
  try {
    readiness = dependencies.getIntegrations();
  } catch {
    return unavailableItem(base);
  }

  const readinessById = new Map(readiness.map((item) => [item.id, item]));
  const latestAuditById = new Map<string, IntegrationAuditRow>();
  for (const row of auditResult.data) {
    if (row.entity_id && !latestAuditById.has(row.entity_id)) {
      latestAuditById.set(row.entity_id, row);
    }
  }

  const now = dependencies.now();
  let configuredCount = 0;
  let verifiedCount = 0;
  for (const id of CRITICAL_INTEGRATION_IDS) {
    if (!isConfigured(readinessById.get(id))) continue;
    configuredCount += 1;
    const audit = latestAuditById.get(id);
    const checkedAt = audit ? Date.parse(audit.created_at) : Number.NaN;
    const ageMs = now - checkedAt;
    if (
      audit &&
      payloadStatus(audit.payload) === "verified" &&
      Number.isFinite(ageMs) &&
      ageMs >= 0 &&
      ageMs <= INTEGRATION_VERIFICATION_MAX_AGE_MS
    ) {
      verifiedCount += 1;
    }
  }

  const allConfigured = configuredCount === CRITICAL_INTEGRATION_IDS.length;
  const allVerified = allConfigured && verifiedCount === configuredCount;
  return {
    ...base,
    status: allVerified ? "complete" : "attention",
    fact: allVerified
      ? `Проверено ${verifiedCount} из ${CRITICAL_INTEGRATION_IDS.length}`
      : `Настроено ${configuredCount} из ${CRITICAL_INTEGRATION_IDS.length}, проверено ${verifiedCount}`,
  };
}

export async function fetchOwnerOnboardingSnapshot(
  supabase: DbClient,
  capabilities: readonly AdminCapability[],
  overrides: Partial<OwnerOnboardingDependencies> = {},
): Promise<OwnerOnboardingSnapshot> {
  const dependencies = { ...DEFAULT_DEPENDENCIES, ...overrides };
  const [siteSettings, tours, publishedContent, activeStaff, integrationAudits] = await Promise.all([
    supabase.from("site_settings").select("key, value").in("key", ["site.branding", "site.design", "site.modules"]),
    supabase.from("tours").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase
      .from("content_documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("admin_staff")
      .select("user_id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("admin_audit_log")
      .select("entity_id, payload, created_at")
      .eq("action", "integration.verify")
      .in("entity_id", [...CRITICAL_INTEGRATION_IDS])
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const siteIdentityBase = {
    id: "site_identity" as const,
    title: "Оформите название и дизайн сайта",
    description: "Название, логотип и визуальная тема должны храниться в настройках сайта.",
    href: "/admin/system/settings",
    linkLabel: "Открыть оформление",
    requiredCapability: "system.settings" as const,
  };
  const siteModulesBase = {
    id: "site_modules" as const,
    title: "Проверьте доступные разделы сайта",
    description: "Модули туров, блога, магазина и других разделов управляются из одной настройки.",
    href: "/admin/system/settings",
    linkLabel: "Открыть модули",
    requiredCapability: "system.settings" as const,
  };

  let siteIdentity: OwnerOnboardingItem;
  let siteModules: OwnerOnboardingItem;
  if (siteSettings.error || !Array.isArray(siteSettings.data)) {
    siteIdentity = unavailableItem(siteIdentityBase);
    siteModules = unavailableItem(siteModulesBase);
  } else {
    const settings = new Map(siteSettings.data.map((row) => [row.key, objectValue(row.value)]));
    const branding = settings.get("site.branding");
    const design = settings.get("site.design");
    const modules = settings.get("site.modules");
    const brandingReady = Boolean(
      branding
      && typeof branding.siteName === "string" && branding.siteName.trim()
      && typeof branding.defaultTitle === "string" && branding.defaultTitle.trim()
      && typeof branding.logoAlt === "string" && branding.logoAlt.trim(),
    );
    const designReady = Boolean(
      design
      && typeof design.palettePreset === "string" && design.palettePreset.trim()
      && typeof design.headingFont === "string" && design.headingFont.trim(),
    );
    const identityFacts = Number(brandingReady) + Number(designReady);
    siteIdentity = brandingReady && designReady
      ? { ...siteIdentityBase, status: "complete", fact: "Название и дизайн сохранены" }
      : { ...siteIdentityBase, status: "attention", fact: `Готово ${identityFacts} из 2 частей оформления` };
    const modulesReady = Boolean(
      modules
      && typeof modules.apartmentsMode === "string"
      && typeof modules.carRentalMode === "string"
      && typeof modules.transfersMode === "string",
    );
    siteModules = modulesReady
      ? { ...siteModulesBase, status: "complete", fact: "Настройка модулей сохранена" }
      : { ...siteModulesBase, status: "attention", fact: "Проверьте и сохраните реальные режимы модулей" };
  }

  let backup: OwnerOnboardingItem;
  const backupBase = {
    id: "backup" as const,
    title: "Подтвердите резервное копирование",
    description: "Рабочая копия и недавняя проверка восстановления защищают данные сайта.",
    href: "/admin/system/settings",
    linkLabel: "Открыть резервирование",
    requiredCapability: "system.settings" as const,
  };
  try {
    const snapshot = dependencies.readOps();
    backup = snapshot.backup.productionReady
      ? { ...backupBase, status: "complete", fact: "Копирование и восстановление подтверждены" }
      : { ...backupBase, status: "attention", fact: "Готовность резервирования не подтверждена" };
  } catch {
    backup = unavailableItem(backupBase);
  }

  const items: OwnerOnboardingItem[] = [
    siteIdentity,
    siteModules,
    countItem(
      {
        id: "tour_catalog",
        title: "Опубликуйте первый тур",
        description: "Предложения появятся в каталоге после заполнения и модерации.",
        href: "/admin/marketplace/tours",
        linkLabel: "Открыть туры",
        requiredCapability: "marketplace.tours",
      },
      tours,
      { empty: "Опубликованных туров пока нет", filled: (count) => `Опубликовано туров: ${count}` },
    ),
    countItem(
      {
        id: "published_content",
        title: "Опубликуйте полезный материал",
        description: "Опубликованные страницы и статьи формируют основу сайта и поиска.",
        href: "/admin/content/documents",
        linkLabel: "Открыть контент",
        requiredCapability: "content.edit",
      },
      publishedContent,
      { empty: "Опубликованных материалов пока нет", filled: (count) => `Опубликовано ${count} материалов` },
    ),
    countItem(
      {
        id: "admin_team",
        title: "Проверьте доступ команды",
        description: "У каждого сотрудника должна быть активная запись и только необходимые права.",
        href: "/admin/system/staff",
        linkLabel: "Открыть команду",
        requiredCapability: "users.manage",
      },
      activeStaff,
      { empty: "Нет активных сотрудников", filled: (count) => `Активных сотрудников: ${count}` },
    ),
    integrationItem(integrationAudits as typeof integrationAudits & { data: IntegrationAuditRow[] | null }, dependencies),
    backup,
  ];

  return {
    generatedAt: new Date(dependencies.now()).toISOString(),
    items: items.filter((item) => hasAdminCapability(capabilities, item.requiredCapability)),
  };
}
