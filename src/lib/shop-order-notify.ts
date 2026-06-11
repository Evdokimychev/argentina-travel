/**
 * Optional email alerts for new shop orders (Resend).
 * Non-blocking — skipped when env is missing.
 */

import { notifyLeadCaptured } from "@/lib/leads-notify";
import type { ShopOrder } from "@/types/shop-order";

export async function notifyShopOrderCreated(order: ShopOrder): Promise<void> {
  const subject = `Новый заказ магазина: ${order.productTitle}`;
  const html = `
    <p>Заказ <strong>${order.id}</strong></p>
    <p>Товар: ${order.productTitle} (${order.productSlug})</p>
    <p>Сумма: $${order.priceUsd} ${order.currency}</p>
    <p>Клиент: ${order.customerName}</p>
    <p>Email: ${order.customerEmail}</p>
    <p>Телефон: ${order.customerPhone || "—"}</p>
    ${order.notes ? `<p>Комментарий: ${order.notes}</p>` : ""}
    <p>Статус: ${order.status}</p>
  `;

  await notifyLeadCaptured({ subject, html });
}
