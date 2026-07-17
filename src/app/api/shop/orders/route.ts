import { NextResponse } from "next/server";
import { fetchPublishedShopProductBySlug } from "@/lib/shop-products-server";
import { isSupabaseShopEnabled } from "@/lib/auth-mode";
import { notifyShopOrderCreated } from "@/lib/shop-order-notify";
import {
  buildShopOrderFromProduct,
  fetchShopOrderById,
  fetchShopOrdersByEmail,
  fetchUserShopOrders,
  insertShopOrder,
} from "@/lib/shop-order-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { isValidBookingOperationKey } from "@/lib/partner-booking/idempotency";
import { isPublicPathEnabled } from "@/lib/public-module-visibility";
import { getClientIp, withRateLimit } from "@/lib/rate-limit";
import { fetchSiteNavigation } from "@/lib/site-settings-server";
import type { ShopOrder } from "@/types/shop-order";
import { verifyGuestFormProtection } from "@/lib/forms/captcha-server";

async function getShopProductBySlug(slug: string) {
  return fetchPublishedShopProductBySlug(slug);
}

function isSameShopOrderRequest(existing: ShopOrder, requested: ShopOrder): boolean {
  return (
    existing.productSlug === requested.productSlug &&
    existing.customerEmail === requested.customerEmail &&
    existing.customerName === requested.customerName &&
    existing.customerPhone === requested.customerPhone &&
    existing.notes === requested.notes &&
    existing.userId === requested.userId
  );
}

async function postShopOrder(request: Request) {
  const navigation = await fetchSiteNavigation();
  if (!isPublicPathEnabled("/shop", navigation)) {
    return NextResponse.json({ error: "Магазин отключён" }, { status: 404 });
  }

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
      captchaToken?: string | null;
      honeypot?: string | null;
    };

    const protection = await verifyGuestFormProtection({
      request,
      formId: "shop_order",
      captchaToken: body.captchaToken,
      honeypot: body.honeypot,
    });
    if (!protection.ok) {
      if (protection.kind === "configuration") {
        return NextResponse.json(
          { error: "Защита оформления заказа временно недоступна." },
          { status: 503 },
        );
      }
      return NextResponse.json({ ok: true });
    }

    const productSlug = body.productSlug?.trim();
    const customerName = body.customerName?.trim();
    const customerEmail = body.customerEmail?.trim();

    if (!productSlug || !customerName || !customerEmail) {
      return NextResponse.json({ error: "Укажите товар, имя и email" }, { status: 400 });
    }

    const product = await getShopProductBySlug(productSlug);
    if (!product) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? null;
    if (!isValidBookingOperationKey(idempotencyKey)) {
      return NextResponse.json(
        { error: "Для безопасного оформления повторите отправку формы." },
        { status: 400 },
      );
    }

    const order = {
      ...buildShopOrderFromProduct({
        product,
        customerName,
        customerEmail,
        customerPhone: body.customerPhone?.trim() ?? "",
        notes: body.notes,
        userId: authUser?.id ?? null,
      }),
      id: `order-shop-${idempotencyKey}`,
    };
    const admin = createSupabaseAdminClient();
    const existing = await fetchShopOrderById(admin, order.id);
    if (existing) {
      if (!isSameShopOrderRequest(existing, order)) {
        return NextResponse.json(
          { error: "Ключ оформления уже использован для другого заказа." },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { order: existing },
        { headers: { "X-Idempotent-Replay": "true" } },
      );
    }

    const result = await insertShopOrder(admin, order);
    if ("error" in result) {
      const raced = await fetchShopOrderById(admin, order.id);
      if (raced && isSameShopOrderRequest(raced, order)) {
        return NextResponse.json(
          { order: raced },
          { headers: { "X-Idempotent-Replay": "true" } },
        );
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    void notifyShopOrderCreated(result.order);

    return NextResponse.json({ order: result.order });
  } catch {
    return NextResponse.json(
      { error: "Не удалось оформить заказ. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(postShopOrder, {
  limit: 5,
  window: 60_000,
  keyPrefix: "shop:orders:create",
  key: (request) => `ip:${getClientIp(request)}`,
});

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
  } catch {
    return NextResponse.json(
      { error: "Не удалось загрузить заказы. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}
