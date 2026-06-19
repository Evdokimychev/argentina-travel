import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchShopOrderById } from "@/lib/shop-order-server";
import type { Database } from "@/types/database";
import type { ShopOrderPaymentStatus, ShopOrderStatus } from "@/types/shop-order";

type PatchBody = {
  status?: ShopOrderStatus;
  paymentStatus?: ShopOrderPaymentStatus;
  deliveryUrl?: string | null;
  notes?: string | null;
};

const ORDER_STATUSES: ShopOrderStatus[] = [
  "pending",
  "awaiting_payment",
  "paid",
  "delivered",
  "cancelled",
];

const PAYMENT_STATUSES: ShopOrderPaymentStatus[] = ["pending", "paid", "refunded"];

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(_request, "operations.shop");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const supabase = createSupabaseAdminClient();
  const order = await fetchShopOrderById(supabase, id);

  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(request, "operations.shop");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await request.json()) as PatchBody;
  const supabase = createSupabaseAdminClient();
  const current = await fetchShopOrderById(supabase, id);

  if (!current) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  const update: Database["public"]["Tables"]["shop_orders"]["Update"] = {
    updated_at: new Date().toISOString(),
  };

  if (body.status !== undefined) {
    if (!ORDER_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Недопустимый статус заказа" }, { status: 400 });
    }
    update.status = body.status;
  }

  if (body.paymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(body.paymentStatus)) {
      return NextResponse.json({ error: "Недопустимый статус оплаты" }, { status: 400 });
    }
    update.payment_status = body.paymentStatus;
  }

  if (body.deliveryUrl !== undefined) {
    update.delivery_url = body.deliveryUrl?.trim() || null;
  }

  if (body.notes !== undefined) {
    update.notes = body.notes?.trim() || null;
  }

  if (Object.keys(update).length <= 1) {
    return NextResponse.json({ error: "Нет полей для обновления" }, { status: 400 });
  }

  const { error } = await supabase.from("shop_orders").update(update).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const order = await fetchShopOrderById(supabase, id);

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "shop_order.update",
    entityType: "shop_order",
    entityId: id,
    payload: update,
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ order });
}
