"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass } from "@/lib/cabinet-ui";

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
};

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
