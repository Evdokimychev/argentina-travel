"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminListSkeleton } from "@/components/ui/skeleton";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import {
  SHOP_ORDER_PAYMENT_STATUS_LABELS,
  SHOP_ORDER_STATUS_LABELS,
  getAdminShopOrderTransitions,
  type ShopOrder,
  type ShopOrderPaymentStatus,
  type ShopOrderStatus,
} from "@/types/shop-order";

type ShopResponse = { orders?: ShopOrder[] };

function shopStatusLabel(status: string): string {
  return status in SHOP_ORDER_STATUS_LABELS
    ? SHOP_ORDER_STATUS_LABELS[status as ShopOrderStatus]
    : status;
}

function paymentStatusLabel(status: string): string {
  return status in SHOP_ORDER_PAYMENT_STATUS_LABELS
    ? SHOP_ORDER_PAYMENT_STATUS_LABELS[status as ShopOrderPaymentStatus]
    : status;
}

export default function ShopOrdersView() {
  const { data, loading, error, refresh } = useAdminApi<ShopResponse>("/api/admin/shop/orders");
  const orders = data?.orders ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<ShopOrder>>({});
  const [busy, setBusy] = useState(false);

  function openOrder(order: ShopOrder) {
    setSelectedId(order.id);
    setDraft({
      status: order.status,
      paymentStatus: order.paymentStatus,
      deliveryUrl: order.deliveryUrl,
      notes: order.notes,
    });
  }

  async function saveOrder() {
    if (!selectedId) return;
    if (!selected) return;
    const nextStatus = draft.status ?? selected.status;
    if (nextStatus !== selected.status) {
      const refundWarning =
        nextStatus === "cancelled" && selected.paymentStatus === "refunded"
          ? " Возврат уже подтверждён, заказ будет закрыт."
          : "";
      if (!window.confirm(
        `Изменить статус «${shopStatusLabel(selected.status)}» на «${shopStatusLabel(nextStatus)}»?${refundWarning}`
      )) return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/shop/orders/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: draft.status,
          deliveryUrl: draft.deliveryUrl,
          notes: draft.notes,
          expectedVersion: selected.operationVersion,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");
      await refresh();
      setSelectedId(null);
    } catch (saveError) {
      alert(saveError instanceof Error ? saveError.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  const selected = orders.find((o) => o.id === selectedId);

  return (
    <CapabilityGate capability="operations.shop">
      <AdminPageShell>
        <AdminPageHeader
          title="Заказы магазина"
          subtitle="Цифровые продукты и доставка ссылок"
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = "/api/admin/shop/orders/export";
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

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={`${cabinetCardClass} overflow-hidden`}>
            <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
              Заказы ({orders.length})
            </h2>
            {loading ? (
              <AdminListSkeleton rows={5} />
            ) : orders.length === 0 ? (
              <EmptyState
                variant="admin"
                icon={ShoppingBag}
                title="Заказов пока нет"
                description="Оформленные заказы магазина появятся в этом списке."
                bordered={false}
              />
            ) : (
              <ul className="divide-y divide-gray-100">
                {orders.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => openOrder(row)}
                      className={`w-full space-y-1 px-5 py-4 text-left text-sm transition-colors hover:bg-gray-50 ${
                        selectedId === row.id ? "bg-sky/5" : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-charcoal">{row.productTitle}</span>
                        <span className="rounded-full bg-sky/10 px-2 py-0.5 text-xs font-medium text-sky">
                          {shopStatusLabel(row.status)}
                        </span>
                        <span className="text-slate">{formatAdminWhen(row.createdAt)}</span>
                      </div>
                      <p className="text-slate">
                        {row.customerName} · {row.customerEmail}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${cabinetCardClass} space-y-4 p-5`}>
            {!selected ? (
              <p className="text-sm text-slate">Выберите заказ для обработки</p>
            ) : (
              <>
                <div>
                  <h2 className="font-heading text-lg font-bold text-charcoal">{selected.productTitle}</h2>
                  <p className="mt-1 text-xs text-slate">
                    {selected.id} · ${selected.priceUsd} · {formatAdminWhen(selected.createdAt)}
                  </p>
                  <p className="mt-2 text-sm text-charcoal">
                    {selected.customerName} · {selected.customerEmail}
                    {selected.customerPhone ? ` · ${selected.customerPhone}` : ""}
                  </p>
                </div>

                <label className="block space-y-1 text-sm">
                  <span className="text-slate">Статус заказа</span>
                  <NativeSelect
                    value={draft.status ?? selected.status}
                    disabled={getAdminShopOrderTransitions(selected).length === 0}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, status: e.target.value as ShopOrderStatus }))
                    }
                  >
                    <option value={selected.status}>{shopStatusLabel(selected.status)}</option>
                    {getAdminShopOrderTransitions(selected).map((status) => (
                      <option key={status} value={status}>
                        → {shopStatusLabel(status)}
                      </option>
                    ))}
                  </NativeSelect>
                </label>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
                  <p className="text-xs text-slate">Оплата</p>
                  <p className="mt-1 font-medium text-charcoal">
                    {paymentStatusLabel(selected.paymentStatus)}
                  </p>
                  <p className="mt-1 text-xs text-slate">
                    Статус оплаты меняется только после подтверждения платёжной системой или оформленного возврата.
                  </p>
                </div>

                <label className="block space-y-1 text-sm">
                  <span className="text-slate">Ссылка на доставку</span>
                  <Input
                    value={draft.deliveryUrl ?? ""}
                    onChange={(e) => setDraft((prev) => ({ ...prev, deliveryUrl: e.target.value }))}
                    placeholder="https://…"
                  />
                </label>

                <label className="block space-y-1 text-sm">
                  <span className="text-slate">Заметки</span>
                  <Input
                    value={draft.notes ?? ""}
                    onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </label>

                <div className="flex gap-2">
                  <Button disabled={busy} onClick={() => void saveOrder()}>
                    Сохранить
                  </Button>
                  <Button variant="ghost" onClick={() => setSelectedId(null)}>
                    Закрыть
                  </Button>
                </div>
              </>
            )}
          </section>
        </div>
      </AdminPageShell>
    </CapabilityGate>
  );
}
