"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import AdminStatusChip from "@/components/admin/AdminStatusChip";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminListSkeleton } from "@/components/ui/skeleton";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import type { ModerationQueueItem } from "@/lib/admin/moderation-server";
import { cabinetCardClass } from "@/lib/cabinet-ui";

type ModerationResponse = { items?: ModerationQueueItem[]; count?: number };

type OrganizerApplication = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  createdAt: string;
};

type ApplicationsResponse = { applications?: OrganizerApplication[] };

const REVIEW_REPORT_REASON_LABELS: Record<string, string> = {
  spam: "Спам",
  offensive: "Оскорбления",
  fake: "Подозрение на фальсификацию",
  irrelevant: "Не относится к туру",
  other: "Другое",
};

export default function ModerationView() {
  const { data, loading, error, refresh } = useAdminApi<ModerationResponse>("/api/admin/moderation");
  const {
    data: appsData,
    loading: appsLoading,
    refresh: refreshApps,
  } = useAdminApi<ApplicationsResponse>("/api/admin/organizer-applications");
  const items = data?.items ?? [];
  const applications = appsData?.applications ?? [];
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
      await refreshApps();
    } catch (resolveError) {
      alert(resolveError instanceof Error ? resolveError.message : "Ошибка");
    } finally {
      setBusyId(null);
    }
  }

  async function resolveItem(id: string, action: "approve" | "reject") {
    const note =
      action === "reject"
        ? window.prompt("Причина отклонения (необязательно):") ?? undefined
        : undefined;

    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/moderation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Ошибка модерации");
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
          title="Модерация"
          subtitle="Очередь проверки туров и отзывов перед публикацией"
          actions={
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              Обновить
            </Button>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <section className={`${cabinetCardClass} overflow-hidden`}>
          <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
            Очередь ({items.length})
          </h2>
          {loading ? (
            <AdminListSkeleton rows={4} />
          ) : items.length === 0 ? (
            <EmptyState
              variant="admin"
              icon={ShieldCheck}
              title="Нет элементов на модерации"
              description="Новые туры, отзывы и заявки организаторов появятся здесь автоматически."
              action={{ label: "Каталог туров", href: "/admin/tours", variant: "outline" }}
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((item) => (
                <li key={item.id} className="space-y-3 px-5 py-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminStatusChip domain="moderation-entity" value={item.entityType} />
                    <AdminStatusChip domain="moderation" value={item.status} />
                    <span className="text-slate">{formatAdminWhen(item.createdAt)}</span>
                  </div>

                  {item.reviewReport ? (
                    <>
                      <p className="font-medium text-charcoal">{item.reviewReport.reviewTourTitle}</p>
                      <p className="text-slate">
                        {item.reviewReport.reviewTourSlug} · оценка {item.reviewReport.reviewRating}/5
                        {item.reviewReport.reporterName
                          ? ` · жалоба от ${item.reviewReport.reporterName}`
                          : ""}
                      </p>
                      <p className="text-slate">
                        Причина:{" "}
                        {REVIEW_REPORT_REASON_LABELS[item.reviewReport.reason] ??
                          item.reviewReport.reason}
                      </p>
                      {item.reviewReport.details ? (
                        <p className="rounded-xl bg-gray-50 p-3 text-charcoal">
                          {item.reviewReport.details}
                        </p>
                      ) : null}
                      <p className="rounded-xl bg-gray-50 p-3 text-charcoal">
                        {item.reviewReport.reviewText}
                      </p>
                      <Link
                        href={`/tours/${item.reviewReport.reviewTourSlug}#reviews`}
                        className="text-sky hover:underline"
                      >
                        Отзыв на странице тура
                      </Link>
                    </>
                  ) : item.review ? (
                    <>
                      <p className="font-medium text-charcoal">{item.review.tourTitle}</p>
                      <p className="text-slate">
                        {item.review.tourSlug} · оценка {item.review.rating}/5
                        {item.review.authorName ? ` · ${item.review.authorName}` : ""}
                      </p>
                      <p className="rounded-xl bg-gray-50 p-3 text-charcoal">{item.review.text}</p>
                      <Link
                        href={`/tours/${item.review.tourSlug}`}
                        className="text-sky hover:underline"
                      >
                        Страница тура
                      </Link>
                    </>
                  ) : item.tour ? (
                    <>
                      <p className="font-medium text-charcoal">{item.tour.title}</p>
                      <p className="text-slate">
                        {item.tour.slug} · организатор {item.tour.ownerUserId}
                      </p>
                      <p className="text-slate">
                        Статус каталога:{" "}
                        <AdminStatusChip domain="tour-catalog" value={item.tour.status} className="ml-1" />
                        · модерация:{" "}
                        <AdminStatusChip domain="moderation" value={item.tour.moderationStatus} />
                      </p>
                      <Link href={`/tours/${item.tour.slug}`} className="text-sky hover:underline">
                        Открыть на сайте
                      </Link>
                    </>
                  ) : (
                    <p className="text-slate">
                      {item.entityType} #{item.entityId}
                    </p>
                  )}

                  {item.reason ? <p className="text-slate">{item.reason}</p> : null}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busyId === item.id}
                      onClick={() => void resolveItem(item.id, "approve")}
                    >
                      {item.entityType === "review_report" ? "Скрыть отзыв" : "Одобрить"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === item.id}
                      onClick={() => void resolveItem(item.id, "reject")}
                    >
                      {item.entityType === "review_report" ? "Отклонить жалобу" : "Отклонить"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${cabinetCardClass} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-4">
            <h2 className="font-heading text-lg font-bold text-charcoal">
              Заявки организаторов ({applications.length})
            </h2>
            <Button variant="outline" size="sm" onClick={() => void refreshApps()} disabled={appsLoading}>
              Обновить
            </Button>
          </div>
          <ul className="divide-y divide-gray-100">
            {applications.length === 0 ? (
              <li className="px-5 py-10 text-sm text-slate">
                {appsLoading ? "Загрузка…" : "Нет заявок"}
              </li>
            ) : (
              applications.map((app) => (
                <li key={app.id} className="space-y-2 px-5 py-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-charcoal">{app.name}</span>
                    <span className="text-slate">{formatAdminWhen(app.createdAt)}</span>
                  </div>
                  <p className="text-slate">
                    {[app.email, app.phone].filter(Boolean).join(" · ") || "—"}
                  </p>
                  {app.message ? <p className="text-charcoal">{app.message}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busyId === app.id}
                      onClick={() => void resolveApplication(app.id, "approve")}
                    >
                      Одобрить
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === app.id}
                      onClick={() => void resolveApplication(app.id, "reject")}
                    >
                      Отклонить
                    </Button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
