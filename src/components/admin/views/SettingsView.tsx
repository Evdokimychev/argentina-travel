"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import ProductionReadinessPanel from "@/components/admin/ProductionReadinessPanel";
import CutoverChecklistPanel from "@/components/admin/CutoverChecklistPanel";
import ThemeSettingsSection from "@/components/settings/ThemeSettingsSection";
import type { ProductionReadinessSnapshot } from "@/lib/ops/production-readiness-types";

type CronRunEntry = {
  ranAt: string;
  ok: boolean;
  message: string;
};

type SettingsResponse = {
  settings?: {
    "site.legal"?: {
      companyName?: string;
      inn?: string;
      ogrn?: string;
      address?: string;
      supportEmail?: string;
    };
    "site.features"?: {
      maintenanceMode?: boolean;
      allowOrganizerSignup?: boolean;
    };
  };
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
};

function formatCronRun(entry: CronRunEntry | null | undefined): string {
  if (!entry) return "Ещё не запускался";
  const status = entry.ok ? "OK" : "ошибка";
  return `${entry.ranAt} — ${status}: ${entry.message}`;
}

export default function SettingsView() {
  const { data, loading, error, refresh } = useAdminApi<SettingsResponse>("/api/admin/settings");
  const [legal, setLegal] = useState({
    companyName: "",
    inn: "",
    ogrn: "",
    address: "",
    supportEmail: "",
  });
  const [features, setFeatures] = useState({
    maintenanceMode: false,
    allowOrganizerSignup: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data?.settings) return;
    if (data.settings["site.legal"]) {
      setLegal({
        companyName: data.settings["site.legal"].companyName ?? "",
        inn: data.settings["site.legal"].inn ?? "",
        ogrn: data.settings["site.legal"].ogrn ?? "",
        address: data.settings["site.legal"].address ?? "",
        supportEmail: data.settings["site.legal"].supportEmail ?? "",
      });
    }
    if (data.settings["site.features"]) {
      setFeatures({
        maintenanceMode: data.settings["site.features"].maintenanceMode ?? false,
        allowOrganizerSignup: data.settings["site.features"].allowOrganizerSignup ?? true,
      });
    }
  }, [data?.settings]);

  async function saveLegal() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "site.legal", value: legal }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Ошибка сохранения");
      }
      await refresh();
    } catch (saveError) {
      alert(saveError instanceof Error ? saveError.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function saveFeatures() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "site.features", value: features }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Ошибка сохранения");
      }
      await refresh();
    } catch (saveError) {
      alert(saveError instanceof Error ? saveError.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CapabilityGate capability="system.settings">
      <AdminPageShell>
        <AdminPageHeader title="Настройки сайта" subtitle="Юридические данные и feature flags" />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {loading ? <p className="text-sm text-slate">Загрузка…</p> : null}

        <ThemeSettingsSection />

        <ProductionReadinessPanel snapshot={data?.productionReadiness} />
        <CutoverChecklistPanel health={data?.publicHealth} readiness={data?.productionReadiness} />

        <section className={`${cabinetCardClass} space-y-4 p-5`}>
          <h2 className="font-heading text-lg font-bold text-foreground">Эксплуатация</h2>
          <p className="text-sm text-slate">
            Подсказки по резервному копированию, последней проверке RLS (CI или{" "}
            <code className="text-xs">npm run rls-audit</code>) и плановым задачам cron (E71).
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

        <section className={`${cabinetCardClass} space-y-4 p-5`}>
          <h2 className="font-heading text-lg font-bold text-charcoal">Юридическая информация</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["companyName", "Название организации"],
                ["inn", "ИНН"],
                ["ogrn", "ОГРН"],
                ["address", "Адрес"],
                ["supportEmail", "Email поддержки"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-sm">
                <span className="text-slate">{label}</span>
                <Input
                  className="mt-1"
                  value={legal[key]}
                  onChange={(e) => setLegal((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          <Button onClick={() => void saveLegal()} disabled={saving}>
            Сохранить юр. данные
          </Button>
        </section>

        <section className={`${cabinetCardClass} space-y-4 p-5`}>
          <h2 className="font-heading text-lg font-bold text-charcoal">Функции</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={features.maintenanceMode}
              onChange={(e) =>
                setFeatures((prev) => ({ ...prev, maintenanceMode: e.target.checked }))
              }
            />
            Режим обслуживания
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={features.allowOrganizerSignup}
              onChange={(e) =>
                setFeatures((prev) => ({ ...prev, allowOrganizerSignup: e.target.checked }))
              }
            />
            Разрешить заявки организаторов
          </label>
          <Button onClick={() => void saveFeatures()} disabled={saving}>
            Сохранить функции
          </Button>
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
