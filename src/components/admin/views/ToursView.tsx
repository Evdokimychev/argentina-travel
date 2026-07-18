"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminListSkeleton } from "@/components/ui/skeleton";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import { useAdminContext } from "@/context/AdminContext";

type TourContentRow = {
  id: string;
  marketCode: string;
  rowVersion: number;
  slug: string;
  ownerUserId: string;
  status: string;
  title: string;
  publishedAt: string | null;
  updatedAt: string;
  moderationStatus?: string;
  productType: "tour" | "excursion";
};

type ToursResponse = {
  tours?: TourContentRow[];
  total?: number;
  limit?: number;
  offset?: number;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  published: "Опубликовано",
  archived: "В архиве",
};

export default function ToursView() {
  const { hasCapability } = useAdminContext();
  const canModerate = hasCapability("marketplace.moderation");
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const [productType, setProductType] = useState("");
  const [mutationId, setMutationId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const limit = 50;
  const url = useMemo(() => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
    if (status) params.set("status", status);
    if (productType) params.set("productType", productType);
    return `/api/admin/tours?${params.toString()}`;
  }, [page, productType, status]);
  const { data, loading, error, refresh } = useAdminApi<ToursResponse>(url);
  const tours = data?.tours ?? [];
  const total = data?.total ?? 0;

  async function changePublication(row: TourContentRow, action: "unpublish" | "archive") {
    const verb = action === "archive" ? "архивировать" : "снять с публикации";
    if (!window.confirm(`Действительно ${verb} «${row.title}»?`)) return;
    setMutationId(row.id);
    setMutationError(null);
    try {
      const response = await fetch(`/api/admin/tours/${encodeURIComponent(row.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, expectedVersion: row.rowVersion }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Не удалось изменить публикацию");
      await refresh();
    } catch (mutationFailure) {
      setMutationError(
        mutationFailure instanceof Error ? mutationFailure.message : "Не удалось изменить публикацию"
      );
    } finally {
      setMutationId(null);
    }
  }

  return (
    <CapabilityGate capability="marketplace.tours">
      <AdminPageShell>
        <AdminPageHeader
          title="Туры"
          subtitle="Каталог, публикация и состояние туров"
          actions={
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              Обновить
            </Button>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {mutationError ? <p className="text-sm text-red-600">{mutationError}</p> : null}

        <section className={`${cabinetCardClass} overflow-hidden`}>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <h2 className="font-heading text-lg font-bold text-charcoal">
              Предложения ({total})
            </h2>
            <div className="flex flex-wrap gap-2">
              <label className="text-xs font-medium text-slate">
                Тип
                <select
                  value={productType}
                  onChange={(event) => { setProductType(event.target.value); setPage(0); }}
                  className="ml-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-charcoal"
                >
                  <option value="">Все</option>
                  <option value="tour">Туры</option>
                  <option value="excursion">Экскурсии</option>
                </select>
              </label>
              <label className="text-xs font-medium text-slate">
                Состояние
                <select
                  value={status}
                  onChange={(event) => { setStatus(event.target.value); setPage(0); }}
                  className="ml-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-charcoal"
                >
                  <option value="">Все</option>
                  <option value="published">Опубликованные</option>
                  <option value="draft">Черновики</option>
                  <option value="archived">Архив</option>
                </select>
              </label>
            </div>
          </div>
          {loading ? (
            <AdminListSkeleton rows={5} />
          ) : tours.length === 0 ? (
            <EmptyState
              variant="admin"
              icon={Map}
              title="Туров в базе пока нет"
              description="Опубликованные туры организаторов появятся здесь после синхронизации."
              action={{ label: "Каталог на сайте", href: "/tours", variant: "outline" }}
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {tours.map((row) => (
                <li key={row.id} className="space-y-2 px-5 py-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-charcoal">{row.title}</span>
                      <span className="rounded-full bg-sky/10 px-2 py-0.5 text-xs font-medium text-sky">
                        {STATUS_LABELS[row.status] ?? row.status}
                      </span>
                      {row.moderationStatus && row.moderationStatus !== "none" ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          модерация: {row.moderationStatus}
                        </span>
                      ) : null}
                    <span className="text-slate">{formatAdminWhen(row.updatedAt)}</span>
                  </div>
                  <p className="text-slate">
                    {row.productType === "excursion" ? "Экскурсия" : "Тур"} · рынок {row.marketCode} · {row.slug}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={row.productType === "excursion" ? `/excursions/${row.slug}` : `/tours/${row.slug}`}
                      className="text-sky hover:underline"
                    >
                      Открыть на сайте
                    </Link>
                    {canModerate && row.status === "published" ? (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={mutationId === row.id}
                        onClick={() => void changePublication(row, "unpublish")}
                      >
                        Снять с публикации
                      </Button>
                    ) : null}
                    {canModerate && row.status !== "archived" ? (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={mutationId === row.id}
                        onClick={() => void changePublication(row, "archive")}
                      >
                        В архив
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {total > limit ? (
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
              <span className="text-sm text-slate">
                {page * limit + 1}–{Math.min((page + 1) * limit, total)} из {total}
              </span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={page === 0 || loading} onClick={() => setPage((value) => Math.max(0, value - 1))}>
                  Назад
                </Button>
                <Button type="button" variant="outline" disabled={(page + 1) * limit >= total || loading} onClick={() => setPage((value) => value + 1)}>
                  Далее
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
