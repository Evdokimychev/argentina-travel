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
  currency: "USD";
  status: ShopOrderStatus;
  paymentStatus: ShopOrderPaymentStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryUrl: string | null;
  notes: string | null;
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
