"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass } from "@/lib/cabinet-ui";

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
  kind: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  context: Record<string, unknown>;
  page_url: string | null;
  created_at: string;
};

type LeadsResponse = {
  newsletter?: NewsletterRow[];
  contacts?: ContactRow[];
};

export default function LeadsView() {
  const { data, loading, error, refresh } = useAdminApi<LeadsResponse>("/api/admin/leads");
  const newsletter = data?.newsletter ?? [];
  const contacts = data?.contacts ?? [];

  return (
    <CapabilityGate capability="operations.leads">
      <AdminPageShell>
        <AdminPageHeader
          title="Лиды и заявки"
          subtitle="Подписки на рассылку и обращения с сайта"
          actions={
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              Обновить
            </Button>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

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
          <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
            Заявки ({contacts.length})
          </h2>
          <ul className="divide-y divide-gray-100">
            {contacts.length === 0 ? (
              <li className="px-5 py-8 text-sm text-slate">{loading ? "Загрузка…" : "Пока пусто"}</li>
            ) : (
              contacts.map((row) => (
                <li key={row.id} className="space-y-1 px-5 py-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-sky/10 px-2 py-0.5 text-xs font-medium text-sky">
                      {row.kind}
                    </span>
                    <span className="font-medium text-charcoal">{row.name}</span>
                    <span className="text-slate">{formatAdminWhen(row.created_at)}</span>
                  </div>
                  <p className="text-slate">
                    {[row.email, row.phone].filter(Boolean).join(" · ") || "—"}
                  </p>
                  {row.message ? <p className="text-charcoal">{row.message}</p> : null}
                  {row.page_url ? (
                    <Link href={row.page_url} className="text-sky hover:underline">
                      Страница обращения
                    </Link>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
