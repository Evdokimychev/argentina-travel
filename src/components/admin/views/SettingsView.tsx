"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import SiteGlobalForm from "@/components/admin/site-globals/SiteGlobalForm";
import AnalyticsReadinessPanel from "@/components/admin/AnalyticsReadinessPanel";
import ProductionReadinessPanel from "@/components/admin/ProductionReadinessPanel";
import CutoverChecklistPanel from "@/components/admin/CutoverChecklistPanel";
import CmsCutoverPanel from "@/components/admin/CmsCutoverPanel";
import CmsOpsPanel from "@/components/admin/cms/CmsOpsPanel";
import SiteGlobalsSeoPreview from "@/components/admin/cms/SiteGlobalsSeoPreview";
import MaintenancePreviewPanel from "@/components/admin/cms/MaintenancePreviewPanel";
import ThemeSettingsSection from "@/components/settings/ThemeSettingsSection";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { CmsOpsSummary } from "@/lib/cms/cms-ops";
import type { CronHealthReport } from "@/lib/ops/ops-status";
import {
  SITE_CONTENT_GLOBAL_KEYS,
  SITE_GLOBAL_DEFINITIONS,
  SITE_MAINTENANCE_GLOBAL_KEYS,
  SITE_OPS_GLOBAL_KEYS,
} from "@/lib/cms/site-globals/registry";
import type { AnalyticsReadinessSnapshot } from "@/lib/ops/analytics-readiness-types";
import type { ProductionReadinessSnapshot } from "@/lib/ops/production-readiness-types";
import type { SiteGlobalKey } from "@/types/site-globals";

type CronRunEntry = {
  ranAt: string;
  ok: boolean;
  message: string;
};

type SettingsResponse = {
  settings?: Partial<Record<SiteGlobalKey, Record<string, unknown>>>;
  updatedAt?: Partial<Record<SiteGlobalKey, string>>;
  ops?: {
    rlsAudit: {
      ok: boolean;
      source: string;
      ranAt: string;
      criticalIssueCount: number;
    } | null;
    backup: {
      lastBackupAt: string | null;
      lastBackupFile: string | null;
      hint: string;
    };
    cron?: {
      digest: CronRunEntry | null;
      cleanupTyping: CronRunEntry | null;
      backupHint: CronRunEntry | null;
      contentFreshness: CronRunEntry | null;
      privacyProcess: CronRunEntry | null;
    };
  };
  productionReadiness?: ProductionReadinessSnapshot;
  analyticsReadiness?: AnalyticsReadinessSnapshot;
  publicHealth?: {
    ok: boolean;
    environment: {
      nodeEnv: string;
      deployEnv: string;
    };
    migrationVersion: string | null;
    checks: {
      database: {
        ok: boolean;
        skipped: boolean;
        error: string | null;
      };
      migrations: {
        latestId: string | null;
        fileCount: number;
      };
    };
  };
  cmsOps?: CmsOpsSummary;
  cronHealth?: CronHealthReport;
};

type SettingsTab = "content" | "ops" | "maintenance";

const TAB_LABELS: Record<SettingsTab, string> = {
  content: "Бренд и контент",
  ops: "Юридическое и функции",
  maintenance: "Эксплуатация",
};

function formatCronRun(entry: CronRunEntry | null | undefined): string {
  if (!entry) return "Ещё не запускался";
  const status = entry.ok ? "OK" : "ошибка";
  return `${entry.ranAt} — ${status}: ${entry.message}`;
}

function emptyGlobalsState(): Record<SiteGlobalKey, Record<string, unknown>> {
  return {
    "site.branding": {},
    "site.seo": {},
    "site.contact": {},
    "site.legal": {},
    "site.features": {},
    "site.maintenance": {},
  };
}

export default function SettingsView() {
  const { data, loading, error, refresh } = useAdminApi<SettingsResponse>("/api/admin/settings");
  const [tab, setTab] = useState<SettingsTab>("content");
  const [globals, setGlobals] = useState(emptyGlobalsState);
  const [savingKey, setSavingKey] = useState<SiteGlobalKey | null>(null);

  useEffect(() => {
    if (!data?.settings) return;
    setGlobals((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(data.settings!) as SiteGlobalKey[]) {
        if (data.settings![key]) {
          next[key] = { ...data.settings![key] };
        }
      }
      return next;
    });
  }, [data?.settings]);

  const saveGlobal = useCallback(
    async (key: SiteGlobalKey) => {
      setSavingKey(key);
      try {
        const res = await fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value: globals[key] }),
        });
        if (!res.ok) {
          const json = (await res.json()) as { error?: string };
          throw new Error(json.error ?? "Ошибка сохранения");
        }
        await refresh();
      } catch (saveError) {
        alert(saveError instanceof Error ? saveError.message : "Ошибка");
      } finally {
        setSavingKey(null);
      }
    },
    [globals, refresh]
  );

  const contentDefinitions = useMemo(() => {
    const keys = new Set<string>(SITE_CONTENT_GLOBAL_KEYS);
    return SITE_GLOBAL_DEFINITIONS.filter((def) => keys.has(def.key));
  }, []);

  const opsDefinitions = useMemo(() => {
    const keys = new Set<string>(SITE_OPS_GLOBAL_KEYS);
    return SITE_GLOBAL_DEFINITIONS.filter((def) => keys.has(def.key));
  }, []);

  const maintenanceDefinitions = useMemo(() => {
    const keys = new Set<string>(SITE_MAINTENANCE_GLOBAL_KEYS);
    return SITE_GLOBAL_DEFINITIONS.filter((def) => keys.has(def.key));
  }, []);

  return (
    <CapabilityGate capability="system.settings">
      <AdminPageShell>
        <AdminPageHeader
          title="Настройки сайта"
          subtitle="Глобальные параметры бренда, SEO, контактов и эксплуатации"
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {loading ? <p className="text-sm text-slate">Загрузка…</p> : null}

        <div className="flex flex-wrap gap-2">
          {(Object.keys(TAB_LABELS) as SettingsTab[]).map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setTab(tabKey)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === tabKey
                  ? "bg-sky text-white"
                  : "bg-surface-elevated text-charcoal hover:bg-sky/10"
              }`}
            >
              {TAB_LABELS[tabKey]}
            </button>
          ))}
        </div>

        {tab === "content" ? (
          <div className="space-y-6">
            {contentDefinitions.map((definition) => (
              <SiteGlobalForm
                key={definition.key}
                definition={definition}
                values={globals[definition.key]}
                onChange={(values) =>
                  setGlobals((prev) => ({ ...prev, [definition.key]: values }))
                }
                onSave={() => void saveGlobal(definition.key)}
                saving={savingKey === definition.key}
                updatedAt={data?.updatedAt?.[definition.key] ?? null}
              />
            ))}
            <SiteGlobalsSeoPreview
              branding={globals["site.branding"]}
              seo={globals["site.seo"]}
            />
          </div>
        ) : null}

        {tab === "ops" ? (
          <div className="space-y-6">
            <CmsCutoverPanel />
            {opsDefinitions.map((definition) => (
              <SiteGlobalForm
                key={definition.key}
                definition={definition}
                values={globals[definition.key]}
                onChange={(values) =>
                  setGlobals((prev) => ({ ...prev, [definition.key]: values }))
                }
                onSave={() => void saveGlobal(definition.key)}
                saving={savingKey === definition.key}
                updatedAt={data?.updatedAt?.[definition.key] ?? null}
              />
            ))}
          </div>
        ) : null}

        {tab === "maintenance" ? (
          <div className="space-y-6">
            <CmsOpsPanel
              cmsOps={data?.cmsOps}
              cronHealth={data?.cronHealth}
              onRefresh={() => void refresh()}
            />
            {maintenanceDefinitions.map((definition) => (
              <SiteGlobalForm
                key={definition.key}
                definition={definition}
                values={globals[definition.key]}
                onChange={(values) =>
                  setGlobals((prev) => ({ ...prev, [definition.key]: values }))
                }
                onSave={() => void saveGlobal(definition.key)}
                saving={savingKey === definition.key}
                updatedAt={data?.updatedAt?.[definition.key] ?? null}
              />
            ))}
            <MaintenancePreviewPanel
              maintenance={globals["site.maintenance"]}
              branding={globals["site.branding"]}
              contact={globals["site.contact"]}
            />
            <ThemeSettingsSection />

            <AnalyticsReadinessPanel snapshot={data?.analyticsReadiness} />
            <ProductionReadinessPanel snapshot={data?.productionReadiness} />
            <CutoverChecklistPanel health={data?.publicHealth} readiness={data?.productionReadiness} />

            <section className={`${cabinetCardClass} space-y-4 p-5`}>
              <h2 className="font-heading text-lg font-bold text-foreground">Эксплуатация</h2>
              <p className="text-sm text-slate">
                Подсказки по резервному копированию, последней проверке RLS (CI или{" "}
                <code className="text-xs">npm run rls-audit</code>) и плановым задачам cron.
              </p>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate">Резервная копия схемы</dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {data?.ops?.backup.hint ?? "Нет данных"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate">Последний RLS-аудит</dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {data?.ops?.rlsAudit ? (
                      <>
                        {data.ops.rlsAudit.ranAt} —{" "}
                        {data.ops.rlsAudit.ok ? (
                          <span className="text-emerald-700">OK</span>
                        ) : (
                          <span className="text-red-600">
                            {data.ops.rlsAudit.criticalIssueCount} критичных проблем
                          </span>
                        )}{" "}
                        ({data.ops.rlsAudit.source})
                      </>
                    ) : (
                      "Аудит ещё не запускался"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate">Cron: ежедневная сводка</dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {formatCronRun(data?.ops?.cron?.digest ?? null)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate">Cron: очистка typing</dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {formatCronRun(data?.ops?.cron?.cleanupTyping ?? null)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate">Cron: резервная копия схемы</dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {formatCronRun(data?.ops?.cron?.backupHint ?? null)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate">Cron: актуальность контента</dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {formatCronRun(data?.ops?.cron?.contentFreshness ?? null)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate">Cron: GDPR soft delete</dt>
                  <dd className="mt-1 font-medium text-charcoal">
                    {formatCronRun(data?.ops?.cron?.privacyProcess ?? null)}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        ) : null}
      </AdminPageShell>
    </CapabilityGate>
  );
}
