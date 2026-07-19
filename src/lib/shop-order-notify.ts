/** Durable operator alerts for new shop orders. */

import { notifyLeadCaptured } from "@/lib/leads-notify";
import { escapeHtml } from "@/lib/notifications/email-templates";
import type { ShopOrder } from "@/types/shop-order";

export async function notifyShopOrderCreated(order: ShopOrder): Promise<void> {
  const subject = `Новый заказ магазина: ${order.productTitle.replace(/[\r\n]+/g, " ")}`;
  const html = `
    <p>Заказ <strong>${escapeHtml(order.id)}</strong></p>
    <p>Товар: ${escapeHtml(order.productTitle)} (${escapeHtml(order.productSlug)})</p>
    <p>Сумма: $${order.priceUsd} ${escapeHtml(order.currency)}</p>
    <p>Клиент: ${escapeHtml(order.customerName)}</p>
    <p>Email: ${escapeHtml(order.customerEmail)}</p>
    <p>Телефон: ${escapeHtml(order.customerPhone || "—")}</p>
    ${order.notes ? `<p>Комментарий: ${escapeHtml(order.notes)}</p>` : ""}
    <p>Статус: ${escapeHtml(order.status)}</p>
  `;

  await notifyLeadCaptured({ subject, html });
}
