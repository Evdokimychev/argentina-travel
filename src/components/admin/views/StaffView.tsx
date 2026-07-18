"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import InlineFeedback from "@/components/feedback/InlineFeedback";
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
  updatedAt: string;
  rowVersion: number;
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

type StaffFeedback = {
  variant: "success" | "error";
  title: string;
  description: string;
};

function validateEmail(value: string): string | undefined {
  const normalized = value.trim();
  if (!normalized) return "Укажите email пользователя.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return "Проверьте адрес: например, name@example.com.";
  }
  return undefined;
}

export default function StaffView() {
  const { data, loading, error, refresh } = useAdminApi<StaffResponse>("/api/admin/staff");
  const [email, setEmail] = useState("");
  const [preset, setPreset] = useState<AdminPresetId>("support_agent");
  const [busy, setBusy] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [changingUserId, setChangingUserId] = useState<string | null>(null);
  const [selectedPresets, setSelectedPresets] = useState<Record<string, AdminPresetId>>({});
  const [feedback, setFeedback] = useState<StaffFeedback | null>(null);

  const emailError = emailTouched ? validateEmail(email) : undefined;

  async function assignStaff(event: React.FormEvent) {
    event.preventDefault();
    setEmailTouched(true);
    const validationError = validateEmail(email);
    if (validationError) return;

    setFeedback(null);
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
      setEmailTouched(false);
      await refresh();
      setFeedback({
        variant: "success",
        title: "Администратор добавлен",
        description: "Права доступа назначены и уже доступны пользователю.",
      });
    } catch (assignError) {
      setFeedback({
        variant: "error",
        title: "Не удалось назначить доступ",
        description: assignError instanceof Error ? assignError.message : "Попробуйте ещё раз.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(row: StaffRow) {
    const { userId, isActive } = row;
    if (
      !window.confirm(
        isActive
          ? "Приостановить доступ этого администратора? Он сразу потеряет доступ к админке."
          : "Восстановить доступ этого администратора?",
      )
    ) {
      return;
    }
    setFeedback(null);
    setTogglingUserId(userId);
    try {
      const res = await fetch(`/api/admin/staff/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !isActive,
          expectedVersion: row.rowVersion,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Не удалось изменить доступ");
      await refresh();
      setFeedback({
        variant: "success",
        title: isActive ? "Доступ приостановлен" : "Доступ восстановлен",
        description: "Статус администратора обновлён.",
      });
    } catch (toggleError) {
      setFeedback({
        variant: "error",
        title: "Не удалось изменить доступ",
        description: toggleError instanceof Error ? toggleError.message : "Попробуйте ещё раз.",
      });
    } finally {
      setTogglingUserId(null);
    }
  }

  async function changePreset(row: StaffRow) {
    const nextPreset = selectedPresets[row.userId] ?? row.preset;
    if (!nextPreset || nextPreset === row.preset) return;
    const label = presets.find((item) => item.id === nextPreset)?.label ?? nextPreset;
    if (!window.confirm(`Назначить роль «${label}» пользователю ${row.fullName}?`)) return;

    setFeedback(null);
    setChangingUserId(row.userId);
    try {
      const res = await fetch(`/api/admin/staff/${row.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // The owner-facing role selector represents the complete assignment.
        // Clear legacy per-user additions so an older permission cannot silently
        // survive a move to a more restrictive role.
        body: JSON.stringify({
          preset: nextPreset,
          capabilities: [],
          expectedVersion: row.rowVersion,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Не удалось изменить роль");
      await refresh();
      setFeedback({
        variant: "success",
        title: "Роль изменена",
        description: `Теперь для ${row.fullName} действует роль «${label}».`,
      });
    } catch (changeError) {
      setFeedback({
        variant: "error",
        title: "Не удалось изменить роль",
        description: changeError instanceof Error ? changeError.message : "Попробуйте ещё раз.",
      });
    } finally {
      setChangingUserId(null);
    }
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

        {error ? (
          <InlineFeedback variant="error" title="Не удалось загрузить команду" description={error} />
        ) : null}
        {feedback ? (
          <InlineFeedback
            variant={feedback.variant}
            title={feedback.title}
            description={feedback.description}
          />
        ) : null}

        <section className={`${cabinetCardClass} p-5`}>
          <h2 className="font-heading text-lg font-bold text-charcoal">Добавить администратора</h2>
          <form
            onSubmit={(e) => void assignStaff(e)}
            noValidate
            className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start"
          >
            <FormField
              id="staff-email"
              label="Email пользователя"
              hint="Пользователь должен быть зарегистрирован на сайте."
              error={emailError}
              required
            >
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailTouched(true);
                  setFeedback(null);
                }}
                onBlur={() => setEmailTouched(true)}
                placeholder="name@example.com"
                required
              />
            </FormField>
            <FormField
              id="staff-preset"
              label="Роль доступа"
              hint={presets.find((item) => item.id === preset)?.description ?? undefined}
            >
              <NativeSelect
                value={preset}
                onChange={(event) => setPreset(event.target.value as AdminPresetId)}
              >
                {presets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <Button type="submit" loading={busy} loadingLabel="Назначаем…" className="sm:mt-[26px]">
              Назначить
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
                    Добавлен {formatAdminWhen(row.createdAt)}
                  </p>
                  {row.preset === "super_admin" ? (
                    <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-800">
                      Владелец проекта. Это назначение защищено от случайного изменения.
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-end gap-2">
                      <FormField
                        id={`staff-role-${row.userId}`}
                        label="Роль доступа"
                        hint={
                          presets.find(
                            (item) =>
                              item.id === (selectedPresets[row.userId] ?? row.preset ?? "support_agent"),
                          )?.description ?? undefined
                        }
                      >
                        <NativeSelect
                          value={selectedPresets[row.userId] ?? row.preset ?? "support_agent"}
                          onChange={(event) =>
                            setSelectedPresets((current) => ({
                              ...current,
                              [row.userId]: event.target.value as AdminPresetId,
                            }))
                          }
                        >
                          {presets
                            .filter((item) => item.id !== "super_admin")
                            .map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.label}
                              </option>
                            ))}
                        </NativeSelect>
                      </FormField>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void changePreset(row)}
                        loading={changingUserId === row.userId}
                        loadingLabel="Сохраняем…"
                        disabled={(selectedPresets[row.userId] ?? row.preset) === row.preset}
                      >
                        Сохранить роль
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void toggleActive(row)}
                        loading={togglingUserId === row.userId}
                        loadingLabel="Обновляем…"
                      >
                        {row.isActive ? "Приостановить доступ" : "Восстановить доступ"}
                      </Button>
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
