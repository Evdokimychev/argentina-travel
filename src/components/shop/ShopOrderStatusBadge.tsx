import type { ShopOrderStatus } from "@/types/shop-order";
import { SHOP_ORDER_STATUS_LABELS } from "@/types/shop-order";
import { cn } from "@/lib/cn";

const SHOP_ORDER_STATUS_TONE: Record<ShopOrderStatus, string> = {
  pending: "bg-slate-100 text-slate-700 ring-slate-200",
  awaiting_payment: "bg-amber-50 text-amber-800 ring-amber-200",
  paid: "bg-sky/10 text-sky ring-sky/20",
  delivered: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
};

export default function ShopOrderStatusBadge({
  status,
  className,
}: {
  status: ShopOrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        SHOP_ORDER_STATUS_TONE[status],
        className
      )}
    >
      {SHOP_ORDER_STATUS_LABELS[status]}
    </span>
  );
}
