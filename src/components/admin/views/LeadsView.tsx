"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { ContactSubmissionKind, ContactSubmissionStatus } from "@/types/database";
import { CONTACT_KIND_LABELS, CONTACT_STATUS_LABELS } from "@/lib/admin/lead-crm";

type NewsletterRow = {
  id: string;
  email: string;
  source: string;
  locale: string | null;
  status: string;
  created_at: string;
};

type ContactRow = {
  id: string;
  kind: ContactSubmissionKind;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  context: Record<string, unknown>;
  page_url: string | null;
  status: ContactSubmissionStatus;
  admin_notes: string;
  next_action_at: string | null;
  created_at: string;
};

type LeadsResponse = {
  newsletter?: NewsletterRow[];
  contacts?: ContactRow[];
  contactsMeta?: { page: number; limit: number; total: number; pages: number };
};

export default function LeadsView() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ContactSubmissionStatus>("all");
  const [page, setPage] = useState(1);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page) });
    if (search.trim()) params.set("q", search.trim());
    if (status !== "all") params.set("status", status);
    return `/api/admin/leads?${params.toString()}`;
  }, [page, search, status]);
  const { data, loading, error, refresh } = useAdminApi<LeadsResponse>(query);
  const newsletter = data?.newsletter ?? [];
  const contacts = data?.contacts ?? [];
  const meta = data?.contactsMeta;

  async function changeStatus(id: string, nextStatus: ContactSubmissionStatus) {
    setSavingId(id);
    setActionError("");
    try {
      const response = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Не удалось обновить статус");
      await refresh();
    } catch (statusError) {
      setActionError(
        statusError instanceof Error ? statusError.message : "Не удалось обновить статус"
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <CapabilityGate capability="operations.leads">
      <AdminPageShell>
        <AdminPageHeader
          title="Лиды и заявки"
          subtitle="Подписки на рассылку и обращения с сайта"
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = "/api/admin/leads/export";
                }}
              >
                CSV
              </Button>
              <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
                Обновить
              </Button>
            </div>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {actionError ? <p className="text-sm text-red-600" role="alert">{actionError}</p> : null}

        <section className={`${cabinetCardClass} overflow-hidden`}>
          <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
            Подписки ({newsletter.length})
          </h2>
          <ul className="divide-y divide-gray-100">
            {newsletter.length === 0 ? (
              <li className="px-5 py-8 text-sm text-slate">{loading ? "Загрузка…" : "Пока пусто"}</li>
            ) : (
              newsletter.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
                >
                  <span className="font-medium text-charcoal">{row.email}</span>
                  <span className="text-slate">
                    {row.source} · {formatAdminWhen(row.created_at)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className={`${cabinetCardClass} overflow-hidden`}>
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-heading text-lg font-bold text-charcoal">
              Заявки ({meta?.total ?? contacts.length})
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
              <Input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Поиск по имени, контакту или сообщению"
                aria-label="Поиск обращений"
              />
              <NativeSelect
                value={status}
                onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }}
                aria-label="Статус обращения"
              >
                <option value="all">Все статусы</option>
                {(Object.keys(CONTACT_STATUS_LABELS) as ContactSubmissionStatus[]).map((value) => (
                  <option key={value} value={value}>{CONTACT_STATUS_LABELS[value]}</option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <ul className="divide-y divide-gray-100">
            {contacts.length === 0 ? (
              <li className="px-5 py-8 text-sm text-slate">{loading ? "Загрузка…" : "Пока пусто"}</li>
            ) : (
              contacts.map((row) => (
                <li key={row.id} className="space-y-1 px-5 py-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-sky/10 px-2 py-0.5 text-xs font-medium text-sky">
                      {CONTACT_KIND_LABELS[row.kind]}
                    </span>
                    <span className="font-medium text-charcoal">{row.name}</span>
                    <span className="text-slate">{formatAdminWhen(row.created_at)}</span>
                  </div>
                  <p className="text-slate">
                    {[row.email, row.phone].filter(Boolean).join(" · ") || "—"}
                  </p>
                  {row.message ? <p className="text-charcoal">{row.message}</p> : null}
                  <div className="pt-2 sm:max-w-56">
                    <NativeSelect
                      value={row.status}
                      disabled={savingId === row.id}
                      onChange={(event) => void changeStatus(row.id, event.target.value as ContactSubmissionStatus)}
                      aria-label={`Статус обращения от ${row.name}`}
                    >
                      {(Object.keys(CONTACT_STATUS_LABELS) as ContactSubmissionStatus[]).map((value) => (
                        <option key={value} value={value}>{CONTACT_STATUS_LABELS[value]}</option>
                      ))}
                    </NativeSelect>
                  </div>
                  {row.page_url ? (
                    <Link href={row.page_url} className="text-sky hover:underline">
                      Страница обращения
                    </Link>
                  ) : null}
                </li>
              ))
            )}
          </ul>
          {meta && meta.pages > 1 ? (
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 text-sm text-slate">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                Назад
              </Button>
              <span>Страница {meta.page} из {meta.pages}</span>
              <Button variant="outline" size="sm" disabled={page >= meta.pages || loading} onClick={() => setPage((value) => value + 1)}>
                Далее
              </Button>
            </div>
          ) : null}
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
