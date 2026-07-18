import { createHash, timingSafeEqual } from "node:crypto";
import type { Json } from "@/types/database";
import type { SiteGlobalKey } from "@/types/site-globals";

export type SiteSettingsCasUpdate = {
  key: SiteGlobalKey;
  value: Json;
  expectedVersion: number;
};

export type SettingsRisk = {
  id: string;
  key: SiteGlobalKey;
  label: string;
};

const BOOLEAN_SWITCHES: Partial<
  Record<SiteGlobalKey, Readonly<Record<string, string>>>
> = {
  "site.features": {
    allowOrganizerSignup: "Закрыть регистрацию новых организаторов",
  },
  "site.navigation": {
    showGeography: "Скрыть географические разделы",
    showDestinations: "Скрыть регионы",
    showPlaces: "Скрыть места",
    showTours: "Скрыть туры",
    showExcursions: "Скрыть экскурсии",
    showGuide: "Скрыть путеводитель",
    showGallery: "Скрыть галерею",
    showImmigration: "Скрыть раздел об эмиграции",
    showKnowledgeBase: "Скрыть базу знаний",
    showForum: "Скрыть форум",
    showShop: "Скрыть магазин",
    showServices: "Скрыть сервисы",
    showJournal: "Скрыть блог",
    showAbout: "Скрыть раздел о проекте",
  },
  "site.modules": {
    showApartmentsInServices: "Убрать апартаменты из сервисов",
    showCarRentalInServices: "Убрать аренду авто из сервисов",
    showTransfersInServices: "Убрать трансферы из сервисов",
  },
  "site.forms": {
    contactEnabled: "Отключить форму обратной связи",
    newsletterEnabled: "Отключить подписку на рассылку",
  },
  "site.email": {
    leadAlertsEnabled: "Отключить уведомления о новых обращениях",
    organizerAlertsEnabled: "Отключить уведомления организаторам",
    dailyDigestEnabled: "Отключить ежедневную сводку",
    contentFreshnessAlertsEnabled: "Отключить контроль актуальности контента",
  },
  "site.seo": {
    allowIndexing: "Запретить индексацию сайта поисковыми системами",
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const row = value as Record<string, unknown>;
  return `{${Object.keys(row)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(row[key])}`)
    .join(",")}}`;
}

export function detectDangerousSettingsChanges(
  currentValues: Partial<Record<SiteGlobalKey, Json>>,
  updates: readonly SiteSettingsCasUpdate[],
): SettingsRisk[] {
  const risks: SettingsRisk[] = [];

  for (const update of updates) {
    const previous = asRecord(currentValues[update.key]);
    const next = asRecord(update.value);

    if (
      update.key === "site.features" &&
      previous.maintenanceMode !== true &&
      next.maintenanceMode === true
    ) {
      risks.push({
        id: "site.features:maintenanceMode:on",
        key: update.key,
        label: "Включить режим обслуживания для публичного сайта",
      });
    }

    const switches = BOOLEAN_SWITCHES[update.key];
    if (switches) {
      for (const [field, label] of Object.entries(switches)) {
        if (previous[field] === true && next[field] === false) {
          risks.push({ id: `${update.key}:${field}:off`, key: update.key, label });
        }
      }
    }

    if (update.key === "site.modules") {
      for (const [field, label] of [
        ["apartmentsMode", "Отключить модуль апартаментов"],
        ["carRentalMode", "Отключить модуль аренды авто"],
        ["transfersMode", "Отключить модуль трансферов"],
        ["hotelsMode", "Отключить будущий модуль отелей"],
      ] as const) {
        if (previous[field] !== "disabled" && next[field] === "disabled") {
          risks.push({ id: `${update.key}:${field}:disabled`, key: update.key, label });
        }
      }
    }

    if (
      update.key === "site.forms" &&
      previous.captchaMode !== "off" &&
      next.captchaMode === "off"
    ) {
      risks.push({
        id: "site.forms:captchaMode:off",
        key: update.key,
        label: "Отключить CAPTCHA для гостевых форм",
      });
    }
  }

  return risks.sort((left, right) => left.id.localeCompare(right.id));
}

export function createSettingsConfirmationToken(
  updates: readonly SiteSettingsCasUpdate[],
  risks: readonly SettingsRisk[],
): string {
  return createHash("sha256")
    .update(
      stableJson({
        updates: [...updates].sort((left, right) => left.key.localeCompare(right.key)),
        riskIds: risks.map((risk) => risk.id).sort(),
      }),
    )
    .digest("hex");
}

export function settingsConfirmationMatches(actual: unknown, expected: string): boolean {
  if (typeof actual !== "string" || !/^[a-f0-9]{64}$/.test(actual)) return false;
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}
