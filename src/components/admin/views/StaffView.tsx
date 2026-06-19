"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import type { AdminPresetId } from "@/types/admin";
import { cabinetCardClass } from "@/lib/cabinet-ui";

type StaffRow = {
  userId: string;
  email: string | null;
  fullName: string;
  preset: AdminPresetId | null;
  capabilities: string[];
  isActive: boolean;
  notes: string | null;
  createdAt: string;
};

type PresetRow = {
  id: AdminPresetId;
  label: string;
  description: string | null;
  capabilities: string[];
};

type StaffResponse = {
  staff?: StaffRow[];
  presets?: PresetRow[];
};

export default function StaffView() {
  const { data, loading, error, refresh } = useAdminApi<StaffResponse>("/api/admin/staff");
  const [email, setEmail] = useState("");
  const [preset, setPreset] = useState<AdminPresetId>("support_agent");
  const [busy, setBusy] = useState(false);

  async function assignStaff(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), preset }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Ошибка");
      setEmail("");
      await refresh();
    } catch (assignError) {
      alert(assignError instanceof Error ? assignError.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(userId: string, isActive: boolean) {
    const res = await fetch(`/api/admin/staff/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      alert(json.error ?? "Ошибка");
      return;
    }
    await refresh();
  }

  const staff = data?.staff ?? [];
  const presets = data?.presets ?? [];

  return (
    <CapabilityGate capability="users.manage">
      <AdminPageShell>
        <AdminPageHeader
          title="Команда админки"
          subtitle="Назначение ролей и пресетов доступа"
          actions={
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              Обновить
            </Button>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <section className={`${cabinetCardClass} p-5`}>
          <h2 className="font-heading text-lg font-bold text-charcoal">Добавить администратора</h2>
          <form onSubmit={(e) => void assignStaff(e)} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email пользователя"
              className="sm:max-w-xs"
            />
            <NativeSelect value={preset} onChange={(e) => setPreset(e.target.value as AdminPresetId)}>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </NativeSelect>
            <Button type="submit" disabled={busy}>
              {busy ? "Назначаем…" : "Назначить"}
            </Button>
          </form>
        </section>

        <section className={`${cabinetCardClass} overflow-hidden`}>
          <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
            Администраторы ({staff.length})
          </h2>
          <ul className="divide-y divide-gray-100">
            {staff.length === 0 ? (
              <li className="px-5 py-10 text-sm text-slate">{loading ? "Загрузка…" : "Пока никого"}</li>
            ) : (
              staff.map((row) => (
                <li key={row.userId} className="space-y-2 px-5 py-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-charcoal">{row.fullName}</span>
                    <span className="text-slate">{row.email}</span>
                    {!row.isActive ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                        неактивен
                      </span>
                    ) : null}
                  </div>
                  <p className="text-slate">
                    Пресет: {row.preset ?? "—"} · {formatAdminWhen(row.createdAt)}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void toggleActive(row.userId, row.isActive)}
                  >
                    {row.isActive ? "Деактивировать" : "Активировать"}
                  </Button>
                </li>
              ))
            )}
          </ul>
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
