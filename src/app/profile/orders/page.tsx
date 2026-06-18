"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import { apiFetchUserShopOrders, isRemoteShopMode } from "@/lib/shop-order-api";
import type { ShopOrder } from "@/types/shop-order";
import ShopOrderStatusBadge from "@/components/shop/ShopOrderStatusBadge";
import FormattedPrice from "@/components/FormattedPrice";
import { EmptyState } from "@/components/ui/empty-state";
import {
  cabinetCardClass,
  cabinetLinkClass,
  cabinetPageSubtitleClass,
  cabinetPageTitleClass,
  cabinetPanelClass,
} from "@/lib/cabinet-ui";

export default function ProfileOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    if (!isRemoteShopMode()) {
      setOrders([]);
      setLoading(false);
      return;
    }

    void apiFetchUserShopOrders()
      .then(setOrders)
      .catch((fetchError: Error) => setError(fetchError.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <div className={cabinetPanelClass}>
      <h1 className={cabinetPageTitleClass}>Мои заказы</h1>
      <p className={cabinetPageSubtitleClass}>PDF-гиды и материалы из магазина</p>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-8 text-sm text-slate">Загрузка…</p>
      ) : orders.length > 0 ? (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <article key={order.id} className={cabinetCardClass + " p-4 sm:p-5"}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/shop/${order.productSlug}`}
                    className="font-heading text-base font-bold text-charcoal transition-colors hover:text-sky"
                  >
                    {order.productTitle}
                  </Link>
                  <p className="mt-1 text-xs text-slate">
                    Заказ {order.id} · {formatBookingCreatedAt(order.createdAt)}
                  </p>
                </div>
                <ShopOrderStatusBadge status={order.status} />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <FormattedPrice priceUsd={order.priceUsd} className="font-semibold" />
                <div className="flex flex-wrap gap-3">
                  {order.deliveryUrl ? (
                    <a
                      href={order.deliveryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cabinetLinkClass}
                    >
                      Скачать PDF
                    </a>
                  ) : (
                    <span className="text-sm text-slate">
                      {order.status === "delivered"
                        ? "Ссылка на файл будет отправлена на email"
                        : "PDF после оплаты"}
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ShoppingBag}
          title="Заказов пока нет"
          description={
            isRemoteShopMode()
              ? "Оформите заказ в магазине PDF-гидов — он появится здесь после входа в аккаунт."
              : "Оформление заказов на сайте доступно после подключения Supabase."
          }
          action={{ label: "В магазин", href: "/shop", variant: "outline" }}
          className="mt-8"
        />
      )}
    </div>
  );
}
