"use client";

import { useState } from "react";
import { CheckCircle2, UserRoundSearch, XCircle } from "lucide-react";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminListSkeleton } from "@/components/ui/skeleton";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass } from "@/lib/cabinet-ui";

type OrganizerApplication = {
  id: string;
  userId: string;
  companyName: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  applicantName: string;
  applicantEmail: string | null;
  applicantPhone: string | null;
};

type ApplicationsResponse = { applications?: OrganizerApplication[] };

export default function MarketplaceOrganizersView() {
  const { data, loading, error, refresh } = useAdminApi<ApplicationsResponse>(
    "/api/admin/organizer-applications"
  );
  const applications = data?.applications ?? [];
  const [busyId, setBusyId] = useState<string | null>(null);

  async function resolveApplication(id: string, action: "approve" | "reject") {
    const note =
      action === "reject"
        ? window.prompt("Причина отклонения (необязательно):") ?? undefined
        : undefined;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/organizer-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Ошибка");
      await refresh();
    } catch (resolveError) {
      alert(resolveError instanceof Error ? resolveError.message : "Ошибка");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <CapabilityGate capability="marketplace.moderation">
      <AdminPageShell>
        <AdminPageHeader
          title="Организаторы"
          subtitle="Очередь заявок: проверка анкеты и допуск в кабинет организатора"
          actions={
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              Обновить
            </Button>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <section className={`${cabinetCardClass} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-4">
            <h2 className="font-heading text-lg font-bold text-charcoal">
              Новые анкеты ({applications.length})
            </h2>
          </div>

          {loading ? (
            <AdminListSkeleton rows={5} />
          ) : applications.length === 0 ? (
            <EmptyState
              variant="admin"
              icon={UserRoundSearch}
              title="Новых заявок нет"
              description="Когда организатор отправит анкету со страницы «Стать организатором», она появится здесь."
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {applications.map((application) => (
                <li key={application.id} className="space-y-3 px-5 py-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-charcoal">{application.applicantName}</p>
                      <p className="text-xs text-slate">{formatAdminWhen(application.createdAt)}</p>
                    </div>
                    <p className="text-xs text-slate">ID пользователя: {application.userId}</p>
                  </div>

                  <p className="text-slate">
                    {[application.applicantEmail, application.applicantPhone].filter(Boolean).join(" · ") || "—"}
                  </p>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate">Проект</p>
                    <p className="mt-1 text-sm font-medium text-charcoal">{application.companyName}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-charcoal">{application.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busyId === application.id}
                      onClick={() => void resolveApplication(application.id, "approve")}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Одобрить
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === application.id}
                      onClick={() => void resolveApplication(application.id, "reject")}
                    >
                      <XCircle className="h-4 w-4" />
                      Отклонить
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
