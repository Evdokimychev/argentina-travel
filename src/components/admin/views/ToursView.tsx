"use client";

import Link from "next/link";
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminListSkeleton } from "@/components/ui/skeleton";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass } from "@/lib/cabinet-ui";

type TourContentRow = {
  id: string;
  slug: string;
  ownerUserId: string;
  status: string;
  title: string;
  publishedAt: string | null;
  updatedAt: string;
  moderationStatus?: string;
};

type ToursResponse = { tours?: TourContentRow[] };

export default function ToursView() {
  const { data, loading, error, refresh } = useAdminApi<ToursResponse>("/api/admin/tours");
  const tours = data?.tours ?? [];

  return (
    <CapabilityGate capability="marketplace.tours">
      <AdminPageShell>
        <AdminPageHeader
          title="Туры"
          subtitle="Каталог туров в Supabase"
          actions={
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              Обновить
            </Button>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <section className={`${cabinetCardClass} overflow-hidden`}>
          <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
            Туры в базе ({tours.length})
          </h2>
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
                <li key={row.id} className="space-y-1 px-5 py-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-charcoal">{row.title}</span>
                      <span className="rounded-full bg-sky/10 px-2 py-0.5 text-xs font-medium text-sky">
                        {row.status}
                      </span>
                      {row.moderationStatus && row.moderationStatus !== "none" ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          модерация: {row.moderationStatus}
                        </span>
                      ) : null}
                    <span className="text-slate">{formatAdminWhen(row.updatedAt)}</span>
                  </div>
                  <p className="text-slate">
                    {row.slug} · {row.ownerUserId}
                  </p>
                  <Link href={`/tours/${row.slug}`} className="text-sky hover:underline">
                    Открыть на сайте
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
