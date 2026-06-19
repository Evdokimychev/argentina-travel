"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import type { ModerationQueueItem } from "@/lib/admin/moderation-server";
import { cabinetCardClass } from "@/lib/cabinet-ui";

type ModerationResponse = { items?: ModerationQueueItem[]; count?: number };

const MODERATION_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  in_review: "На проверке",
  approved: "Одобрено",
  rejected: "Отклонено",
};

export default function ModerationView() {
  const { data, loading, error, refresh } = useAdminApi<ModerationResponse>("/api/admin/moderation");
  const items = data?.items ?? [];
  const [busyId, setBusyId] = useState<string | null>(null);

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
          subtitle="Очередь проверки туров перед публикацией"
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
          <ul className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <li className="px-5 py-10 text-sm text-slate">
                {loading ? "Загрузка…" : "Нет элементов на модерации"}
              </li>
            ) : (
              items.map((item) => (
                <li key={item.id} className="space-y-3 px-5 py-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      {item.entityType}
                    </span>
                    <span className="rounded-full bg-sky/10 px-2 py-0.5 text-xs font-medium text-sky">
                      {MODERATION_STATUS_LABELS[item.status] ?? item.status}
                    </span>
                    <span className="text-slate">{formatAdminWhen(item.createdAt)}</span>
                  </div>

                  {item.tour ? (
                    <>
                      <p className="font-medium text-charcoal">{item.tour.title}</p>
                      <p className="text-slate">
                        {item.tour.slug} · организатор {item.tour.ownerUserId}
                      </p>
                      <p className="text-slate">
                        Статус каталога: {item.tour.status} · модерация:{" "}
                        {item.tour.moderationStatus}
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
                      Одобрить
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === item.id}
                      onClick={() => void resolveItem(item.id, "reject")}
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
