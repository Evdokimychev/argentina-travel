"use client";

import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import { SHOP_ORDER_STATUS_LABELS } from "@/types/shop-order";

type ShopOrderRow = {
  id: string;
  productTitle: string;
  productSlug: string;
  priceUsd: number;
  currency: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryUrl: string | null;
  notes: string | null;
  createdAt: string;
};

type ShopResponse = { orders?: ShopOrderRow[] };

function shopStatusLabel(status: string): string {
  return status in SHOP_ORDER_STATUS_LABELS
    ? SHOP_ORDER_STATUS_LABELS[status as keyof typeof SHOP_ORDER_STATUS_LABELS]
    : status;
}

export default function ShopOrdersView() {
  const { data, loading, error, refresh } = useAdminApi<ShopResponse>("/api/admin/shop/orders");
  const orders = data?.orders ?? [];

  return (
    <CapabilityGate capability="operations.shop">
      <AdminPageShell>
        <AdminPageHeader
          title="Заказы магазина"
          subtitle="Цифровые продукты и доставка ссылок"
          actions={
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              Обновить
            </Button>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <section className={`${cabinetCardClass} overflow-hidden`}>
          <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
            Заказы ({orders.length})
          </h2>
          <ul className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <li className="px-5 py-8 text-sm text-slate">{loading ? "Загрузка…" : "Пока пусто"}</li>
            ) : (
              orders.map((row) => (
                <li key={row.id} className="space-y-1 px-5 py-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-charcoal">{row.productTitle}</span>
                    <span className="rounded-full bg-sky/10 px-2 py-0.5 text-xs font-medium text-sky">
                      {shopStatusLabel(row.status)}
                    </span>
                    <span className="text-slate">{formatAdminWhen(row.createdAt)}</span>
                  </div>
                  <p className="text-slate">
                    {row.id} · ${row.priceUsd} {row.currency}
                  </p>
                  <p className="text-charcoal">
                    {row.customerName} · {row.customerEmail}
                    {row.customerPhone ? ` · ${row.customerPhone}` : ""}
                  </p>
                  {row.notes ? <p className="text-slate">{row.notes}</p> : null}
                  {row.deliveryUrl ? (
                    <a
                      href={row.deliveryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky hover:underline"
                    >
                      Ссылка на доставку
                    </a>
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
