"use client";

import { useCallback, useState } from "react";
import { Trash2 } from "lucide-react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { UrlRedirect, UrlRedirectStatusCode } from "@/types/url-redirect";
import { URL_REDIRECT_STATUS_CODES } from "@/types/url-redirect";

type RedirectsResponse = {
  redirects?: UrlRedirect[];
  error?: string;
};

const EMPTY_FORM = {
  fromPath: "",
  toPath: "",
  statusCode: 301 as UrlRedirectStatusCode,
  note: "",
};

export default function RedirectsView() {
  const { data, loading, error, refresh } = useAdminApi<RedirectsResponse>("/api/admin/redirects");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const createRedirect = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/redirects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");
      setForm(EMPTY_FORM);
      await refresh();
    } catch (saveError) {
      alert(saveError instanceof Error ? saveError.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }, [form, refresh]);

  async function toggleEnabled(redirect: UrlRedirect) {
    const res = await fetch(`/api/admin/redirects/${redirect.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !redirect.enabled }),
    });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      alert(json.error ?? "Ошибка");
      return;
    }
    await refresh();
  }

  async function removeRedirect(id: string) {
    if (!confirm("Удалить редирект?")) return;
    const res = await fetch(`/api/admin/redirects/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      alert(json.error ?? "Ошибка");
      return;
    }
    await refresh();
  }

  return (
    <CapabilityGate capability="system.settings">
      <AdminPageShell>
        <AdminPageHeader
          title="Редиректы URL"
          subtitle="Управление 301/302 — паттерн Payload plugin-redirects"
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {loading ? <p className="text-sm text-slate">Загрузка…</p> : null}

        <section className={`${cabinetCardClass} space-y-4 p-5`}>
          <h2 className="font-heading text-lg font-bold text-charcoal">Новый редирект</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-slate">Откуда (path)</span>
              <Input
                className="mt-1 font-mono text-xs"
                placeholder="/old-path"
                value={form.fromPath}
                onChange={(e) => setForm((prev) => ({ ...prev, fromPath: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate">Куда (path или URL)</span>
              <Input
                className="mt-1 font-mono text-xs"
                placeholder="/new-path"
                value={form.toPath}
                onChange={(e) => setForm((prev) => ({ ...prev, toPath: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate">HTTP-код</span>
              <NativeSelect
                className="mt-1"
                value={String(form.statusCode)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    statusCode: Number(e.target.value) as UrlRedirectStatusCode,
                  }))
                }
              >
                {URL_REDIRECT_STATUS_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-slate">Заметка (необязательно)</span>
              <Input
                className="mt-1"
                value={form.note}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              />
            </label>
          </div>
          <Button type="button" onClick={() => void createRedirect()} disabled={saving}>
            {saving ? "Сохранение…" : "Добавить редирект"}
          </Button>
        </section>

        <section className={`${cabinetCardClass} overflow-x-auto p-5`}>
          <h2 className="font-heading text-lg font-bold text-charcoal">
            Активные правила ({data?.redirects?.length ?? 0})
          </h2>
          <table className="mt-4 w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-slate">
                <th className="py-2 pr-3">Откуда</th>
                <th className="py-2 pr-3">Куда</th>
                <th className="py-2 pr-3">Код</th>
                <th className="py-2 pr-3">Статус</th>
                <th className="py-2"> </th>
              </tr>
            </thead>
            <tbody>
              {(data?.redirects ?? []).map((redirect) => (
                <tr key={redirect.id} className="border-b border-gray-50">
                  <td className="py-3 pr-3 font-mono text-xs">{redirect.fromPath}</td>
                  <td className="py-3 pr-3 font-mono text-xs">{redirect.toPath}</td>
                  <td className="py-3 pr-3">{redirect.statusCode}</td>
                  <td className="py-3 pr-3">
                    <button
                      type="button"
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        redirect.enabled
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-slate"
                      }`}
                      onClick={() => void toggleEnabled(redirect)}
                    >
                      {redirect.enabled ? "Включён" : "Выключен"}
                    </button>
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Удалить"
                      onClick={() => void removeRedirect(redirect.id)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && (data?.redirects?.length ?? 0) === 0 ? (
            <p className="mt-4 text-sm text-slate">Правил пока нет.</p>
          ) : null}
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
