import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchShopOrderById, transitionAdminShopOrderAtomic } from "@/lib/shop-order-server";
import type { ShopOrderStatus } from "@/types/shop-order";

type PatchBody = {
  status?: ShopOrderStatus;
  paymentStatus?: unknown;
  deliveryUrl?: string | null;
  notes?: string | null;
  expectedVersion?: number;
};

const ORDER_STATUSES: ShopOrderStatus[] = [
  "pending",
  "awaiting_payment",
  "paid",
  "delivered",
  "cancelled",
];

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
  if (auth.via !== "session") {
    return NextResponse.json(
      { error: "Изменение заказа доступно только авторизованному сотруднику." },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as PatchBody | null;
  if (!body) {
    return NextResponse.json({ error: "Проверьте данные заказа." }, { status: 400 });
  }
  if (body.paymentStatus !== undefined) {
    return NextResponse.json(
      { error: "Статус оплаты подтверждает платёжная система; вручную менять его нельзя." },
      { status: 409 },
    );
  }
  if (!Number.isSafeInteger(body.expectedVersion) || (body.expectedVersion ?? 0) < 1) {
    return NextResponse.json(
      { error: "Обновите список заказов и повторите действие." },
      { status: 409 },
    );
  }
  if ((body.notes?.length ?? 0) > 2000 || (body.deliveryUrl?.length ?? 0) > 2048) {
    return NextResponse.json({ error: "Ссылка или заметка слишком длинные." }, { status: 400 });
  }
  const supabase = createSupabaseAdminClient();
  const current = await fetchShopOrderById(supabase, id);

  if (!current) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  const nextStatus = body.status ?? current.status;
  if (!ORDER_STATUSES.includes(nextStatus)) {
    return NextResponse.json({ error: "Выберите допустимый статус заказа." }, { status: 400 });
  }

  const result = await transitionAdminShopOrderAtomic(supabase, {
    orderId: id,
    expectedVersion: body.expectedVersion!,
    actorUserId: auth.actorId,
    nextStatus,
    deliveryUrl: body.deliveryUrl === undefined ? current.deliveryUrl : body.deliveryUrl,
    notes: body.notes === undefined ? current.notes : body.notes,
    ipAddress: clientIpFromRequest(request),
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ order: result.order });
}
