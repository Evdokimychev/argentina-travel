export type ShopOrderStatus =
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "delivered"
  | "cancelled";

export type ShopOrderPaymentStatus = "pending" | "paid" | "refunded";

export type ShopOrder = {
  id: string;
  userId: string | null;
  guestEmail: string | null;
  productId: string;
  productSlug: string;
  productTitle: string;
  priceUsd: number;
  currency: string;
  status: ShopOrderStatus;
  paymentStatus: ShopOrderPaymentStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryUrl: string | null;
  notes: string | null;
  operationVersion: number;
  createdAt: string;
  updatedAt: string;
};

export const SHOP_ORDER_STATUS_LABELS: Record<ShopOrderStatus, string> = {
  pending: "Заказ создан",
  awaiting_payment: "Ожидает оплаты",
  paid: "Оплачен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export const SHOP_ORDER_PAYMENT_STATUS_LABELS: Record<ShopOrderPaymentStatus, string> = {
  pending: "Не оплачен",
  paid: "Оплачен",
  refunded: "Возврат",
};

export function getAdminShopOrderTransitions(order: Pick<ShopOrder, "status" | "paymentStatus">): ShopOrderStatus[] {
  if (order.status === "pending") {
    if (order.paymentStatus === "paid") return ["awaiting_payment"];
    if (order.paymentStatus === "refunded") return ["cancelled"];
    return ["awaiting_payment", "cancelled"];
  }
  if (order.status === "awaiting_payment") {
    return order.paymentStatus === "paid" ? ["paid"] : ["cancelled"];
  }
  if (order.status === "paid") {
    return order.paymentStatus === "refunded" ? ["cancelled"] : ["delivered"];
  }
  if (order.status === "delivered" && order.paymentStatus === "refunded") return ["cancelled"];
  return [];
}
