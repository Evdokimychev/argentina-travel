import type { ShopOrderRow } from "@/types/database";
import type { ShopOrder, ShopOrderPaymentStatus, ShopOrderStatus } from "@/types/shop-order";
import { normalizeContactEmail } from "@/lib/guest-booking";

const SHOP_ORDER_STATUSES: ShopOrderStatus[] = [
  "pending",
  "awaiting_payment",
  "paid",
  "delivered",
  "cancelled",
];

const SHOP_PAYMENT_STATUSES: ShopOrderPaymentStatus[] = ["pending", "paid", "refunded"];

function parseStatus(value: string): ShopOrderStatus {
  return SHOP_ORDER_STATUSES.includes(value as ShopOrderStatus)
    ? (value as ShopOrderStatus)
    : "pending";
}

function parsePaymentStatus(value: string): ShopOrderPaymentStatus {
  return SHOP_PAYMENT_STATUSES.includes(value as ShopOrderPaymentStatus)
    ? (value as ShopOrderPaymentStatus)
    : "pending";
}

export function rowToShopOrder(row: ShopOrderRow): ShopOrder {
  return {
    id: row.id,
    userId: row.user_id,
    guestEmail: row.guest_email,
    productId: row.product_id,
    productSlug: row.product_slug,
    productTitle: row.product_title,
    priceUsd: Number(row.price_usd),
    currency: "USD",
    status: parseStatus(row.status),
    paymentStatus: parsePaymentStatus(row.payment_status),
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    deliveryUrl: row.delivery_url,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowsToShopOrders(rows: ShopOrderRow[]): ShopOrder[] {
  return rows.map(rowToShopOrder);
}

export function shopOrderToRow(
  order: ShopOrder
): Omit<ShopOrderRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
} {
  return {
    id: order.id,
    user_id: order.userId,
    guest_email: order.guestEmail,
    product_id: order.productId,
    product_slug: order.productSlug,
    product_title: order.productTitle,
    price_usd: order.priceUsd,
    currency: order.currency,
    status: order.status,
    payment_status: order.paymentStatus,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    customer_phone: order.customerPhone,
    delivery_url: order.deliveryUrl,
    notes: order.notes,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}

export function createShopOrderId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `order-shop-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `order-shop-${Date.now().toString(36)}`;
}

export function shopOrderMatchesEmail(order: ShopOrder, email: string): boolean {
  const normalized = normalizeContactEmail(email);
  if (!normalized) return false;
  return (
    normalizeContactEmail(order.customerEmail) === normalized ||
    (order.guestEmail ? normalizeContactEmail(order.guestEmail) === normalized : false)
  );
}
