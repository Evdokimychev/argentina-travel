"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminApi } from "@/hooks/useAdminApi";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import {
  SHOP_ORDER_PAYMENT_STATUS_LABELS,
  SHOP_ORDER_STATUS_LABELS,
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
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/shop/orders/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: draft.status,
          paymentStatus: draft.paymentStatus,
          deliveryUrl: draft.deliveryUrl,
          notes: draft.notes,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");
      await refresh();
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
            <ul className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <li className="px-5 py-8 text-sm text-slate">{loading ? "Загрузка…" : "Пока пусто"}</li>
              ) : (
                orders.map((row) => (
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
                ))
              )}
            </ul>
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
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, status: e.target.value as ShopOrderStatus }))
                    }
                  >
                    {Object.entries(SHOP_ORDER_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect>
                </label>

                <label className="block space-y-1 text-sm">
                  <span className="text-slate">Оплата</span>
                  <NativeSelect
                    value={draft.paymentStatus ?? selected.paymentStatus}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        paymentStatus: e.target.value as ShopOrderPaymentStatus,
                      }))
                    }
                  >
                    {Object.entries(SHOP_ORDER_PAYMENT_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect>
                </label>

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
