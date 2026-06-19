import { NextResponse } from "next/server";
import { getShopProductBySlug } from "@/data/shop-products";
import { isSupabaseShopEnabled } from "@/lib/auth-mode";
import { notifyShopOrderCreated } from "@/lib/shop-order-notify";
import {
  buildShopOrderFromProduct,
  fetchShopOrdersByEmail,
  fetchUserShopOrders,
  insertShopOrder,
} from "@/lib/shop-order-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import type { ShopOrder } from "@/types/shop-order";

export async function POST(request: Request) {
  if (!isSupabaseShopEnabled()) {
    return NextResponse.json({ error: "Shop API unavailable" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      productSlug?: string;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      notes?: string;
    };

    const productSlug = body.productSlug?.trim();
    const customerName = body.customerName?.trim();
    const customerEmail = body.customerEmail?.trim();

    if (!productSlug || !customerName || !customerEmail) {
      return NextResponse.json({ error: "Укажите товар, имя и email" }, { status: 400 });
    }

    const product = getShopProductBySlug(productSlug);
    if (!product) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const order = buildShopOrderFromProduct({
      product,
      customerName,
      customerEmail,
      customerPhone: body.customerPhone?.trim() ?? "",
      notes: body.notes,
      userId: authUser?.id ?? null,
    });

    const result = await insertShopOrder(supabase, order);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    void notifyShopOrderCreated(result.order);

    return NextResponse.json({ order: result.order });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (!isSupabaseShopEnabled()) {
    return NextResponse.json({ error: "Shop API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = await loadSessionUserFromSupabase(supabase);
    if (!sessionUser) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const byUserId = await fetchUserShopOrders(supabase, authUser.id);
    const byEmail = sessionUser.email
      ? await fetchShopOrdersByEmail(supabase, sessionUser.email)
      : [];

    const merged = new Map<string, ShopOrder>();
    for (const order of [...byUserId, ...byEmail]) {
      merged.set(order.id, order);
    }

    return NextResponse.json({
      orders: Array.from(merged.values()).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      ),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
