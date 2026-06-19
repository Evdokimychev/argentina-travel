"use client";

import { useState } from "react";
import { CheckCircle2, MessageSquare, UserRoundSearch, XCircle } from "lucide-react";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminListSkeleton } from "@/components/ui/skeleton";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import {
  EXPERT_CATEGORY_LABELS,
  EXPERT_INQUIRY_STATUS_LABELS,
  EXPERT_STATUS_LABELS,
  type ExpertInquiryView,
  type LocalExpertView,
} from "@/types/local-experts";

type ExpertsResponse = { experts?: LocalExpertView[] };
type InquiriesResponse = { inquiries?: ExpertInquiryView[] };

export default function MarketplaceExpertsView() {
  const [tab, setTab] = useState<"experts" | "inquiries">("experts");
  const expertsApi = useAdminApi<ExpertsResponse>("/api/admin/experts");
  const inquiriesApi = useAdminApi<InquiriesResponse>(
    "/api/admin/experts?view=inquiries",
    tab === "inquiries"
  );

  const experts = expertsApi.data?.experts ?? [];
  const inquiries = inquiriesApi.data?.inquiries ?? [];
  const [busyId, setBusyId] = useState<string | null>(null);

  async function patchExpert(id: string, action: "publish" | "archive" | "reject") {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/experts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Ошибка");
      await expertsApi.refresh();
    } catch (patchError) {
      alert(patchError instanceof Error ? patchError.message : "Ошибка");
    } finally {
      setBusyId(null);
    }
  }

  async function patchInquiry(id: string, inquiryStatus: "open" | "replied" | "closed") {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/experts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryId: id, inquiryStatus }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Ошибка");
      await inquiriesApi.refresh();
    } catch (patchError) {
      alert(patchError instanceof Error ? patchError.message : "Ошибка");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <CapabilityGate capability="marketplace.moderation">
      <AdminPageShell>
        <AdminPageHeader
          title="Эксперты"
          subtitle="Модерация профилей локальных экспертов и обращений туристов"
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant={tab === "experts" ? "default" : "outline"}
                onClick={() => setTab("experts")}
              >
                Профили
              </Button>
              <Button
                variant={tab === "inquiries" ? "default" : "outline"}
                onClick={() => setTab("inquiries")}
              >
                Обращения
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  void (tab === "experts" ? expertsApi.refresh() : inquiriesApi.refresh())
                }
              >
                Обновить
              </Button>
            </div>
          }
        />

        {tab === "experts" ? (
          <section className={`${cabinetCardClass} overflow-hidden`}>
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="font-heading text-lg font-bold text-charcoal">
                Профили экспертов ({experts.length})
              </h2>
            </div>

            {expertsApi.loading ? (
              <AdminListSkeleton rows={5} />
            ) : expertsApi.error ? (
              <p className="px-5 py-4 text-sm text-red-600">{expertsApi.error}</p>
            ) : experts.length === 0 ? (
              <EmptyState
                variant="admin"
                icon={UserRoundSearch}
                title="Профилей пока нет"
                description="Заявки организаторов и специалистов появятся здесь после отправки анкеты."
              />
            ) : (
              <ul className="divide-y divide-gray-100">
                {experts.map((expert) => (
                  <li key={expert.id} className="space-y-3 px-5 py-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-charcoal">{expert.name}</p>
                        <p className="text-xs text-slate">
                          {expert.city} · /experts/{expert.slug}
                        </p>
                      </div>
                      <span className="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium">
                        {EXPERT_STATUS_LABELS[expert.status]}
                      </span>
                    </div>

                    <p className="text-slate">{expert.bio}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {expert.categories.map((category) => (
                        <span
                          key={category}
                          className="rounded-full bg-gray-50 px-2 py-0.5 text-xs"
                        >
                          {EXPERT_CATEGORY_LABELS[category]}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-slate">
                      {formatAdminWhen(expert.createdAt)}
                      {expert.userId ? ` · user ${expert.userId}` : " · без аккаунта"}
                    </p>

                    {expert.status === "pending" ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          disabled={busyId === expert.id}
                          onClick={() => void patchExpert(expert.id, "publish")}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Опубликовать
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === expert.id}
                          onClick={() => void patchExpert(expert.id, "reject")}
                        >
                          <XCircle className="h-4 w-4" />
                          Отклонить
                        </Button>
                      </div>
                    ) : expert.status === "published" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === expert.id}
                        onClick={() => void patchExpert(expert.id, "archive")}
                      >
                        В архив
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section className={`${cabinetCardClass} overflow-hidden`}>
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="font-heading text-lg font-bold text-charcoal">
                Обращения туристов ({inquiries.length})
              </h2>
            </div>

            {inquiriesApi.loading ? (
              <AdminListSkeleton rows={5} />
            ) : inquiriesApi.error ? (
              <p className="px-5 py-4 text-sm text-red-600">{inquiriesApi.error}</p>
            ) : inquiries.length === 0 ? (
              <EmptyState
                variant="admin"
                icon={MessageSquare}
                title="Обращений пока нет"
                description="Когда турист напишет эксперту, запись появится в этой очереди."
              />
            ) : (
              <ul className="divide-y divide-gray-100">
                {inquiries.map((inquiry) => (
                  <li key={inquiry.id} className="space-y-3 px-5 py-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-charcoal">
                          {inquiry.userName} → {inquiry.expertName}
                        </p>
                        <p className="text-xs text-slate">{formatAdminWhen(inquiry.createdAt)}</p>
                      </div>
                      <span className="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium">
                        {EXPERT_INQUIRY_STATUS_LABELS[inquiry.status]}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap text-charcoal">{inquiry.message}</p>

                    <div className="flex flex-wrap gap-2">
                      {inquiry.threadId ? (
                        <a
                          href={`/profile/messages?thread=${inquiry.threadId}`}
                          className="inline-flex h-8 items-center rounded-lg border border-gray-200 px-3 text-sm font-medium hover:bg-gray-50"
                        >
                          Переписка
                        </a>
                      ) : null}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === inquiry.id}
                        onClick={() => void patchInquiry(inquiry.id, "replied")}
                      >
                        Отмечено: ответ дан
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === inquiry.id}
                        onClick={() => void patchInquiry(inquiry.id, "closed")}
                      >
                        Закрыть
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </AdminPageShell>
    </CapabilityGate>
  );
}
