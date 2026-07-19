import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ShopProduct } from "@/types/shop-product";
import type { ShopOrder } from "@/types/shop-order";
import type { SessionUser } from "@/types/user";
import {
  createShopOrderId,
  rowToShopOrder,
  rowsToShopOrders,
  shopOrderMatchesEmail,
  shopOrderToRow,
} from "@/lib/shop-order-mapper";
import { normalizeContactEmail } from "@/lib/guest-booking";

type DbClient = SupabaseClient<Database>;

export async function fetchShopOrderById(
  supabase: DbClient,
  orderId: string
): Promise<ShopOrder | null> {
  const { data, error } = await supabase
    .from("shop_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToShopOrder(data);
}

export async function fetchUserShopOrders(
  supabase: DbClient,
  userId: string
): Promise<ShopOrder[]> {
  const { data, error } = await supabase
    .from("shop_orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return rowsToShopOrders(data);
}

export async function fetchShopOrdersByEmail(
  supabase: DbClient,
  email: string
): Promise<ShopOrder[]> {
  const normalized = normalizeContactEmail(email);
  if (!normalized) return [];

  const [byCustomer, byGuest] = await Promise.all([
    supabase
      .from("shop_orders")
      .select("*")
      .is("user_id", null)
      .ilike("customer_email", normalized)
      .order("created_at", { ascending: false }),
    supabase
      .from("shop_orders")
      .select("*")
      .is("user_id", null)
      .ilike("guest_email", normalized)
      .order("created_at", { ascending: false }),
  ]);

  if (byCustomer.error && byGuest.error) return [];

  const merged = new Map<string, ShopOrder>();
  for (const row of [...(byCustomer.data ?? []), ...(byGuest.data ?? [])]) {
    merged.set(row.id, rowToShopOrder(row));
  }

  return Array.from(merged.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function fetchAllShopOrdersAdmin(supabase: DbClient): Promise<ShopOrder[]> {
  const { data, error } = await supabase
    .from("shop_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];
  return rowsToShopOrders(data);
}

export function canAccessShopOrder(
  order: ShopOrder,
  actor: SessionUser | null,
  profileEmail?: string | null
): boolean {
  if (!actor) return false;
  if (order.userId === actor.id) return true;
  const email = profileEmail ?? actor.email;
  return email ? shopOrderMatchesEmail(order, email) : false;
}

export async function insertShopOrder(
  supabase: DbClient,
  order: ShopOrder
): Promise<{ order: ShopOrder } | { error: string }> {
  const row = shopOrderToRow(order);
  const { error } = await supabase.from("shop_orders").insert(row);

  if (error) {
    return { error: error.message };
  }

  return { order };
}

export async function attachGuestShopOrdersByEmail(
  supabase: DbClient,
  userId: string,
  email: string
): Promise<number> {
  const normalized = normalizeContactEmail(email);
  if (!normalized) return 0;

  const [byCustomer, byGuest] = await Promise.all([
    supabase.from("shop_orders").select("*").is("user_id", null).ilike("customer_email", normalized),
    supabase.from("shop_orders").select("*").is("user_id", null).ilike("guest_email", normalized),
  ]);

  const rows = [...(byCustomer.data ?? []), ...(byGuest.data ?? [])];
  const uniqueRows = Array.from(new Map(rows.map((row) => [row.id, row])).values());
  if (!uniqueRows.length) return 0;

  let attached = 0;
  for (const row of uniqueRows) {
    const { error: updateError } = await supabase
      .from("shop_orders")
      .update({
        user_id: userId,
        guest_email: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (!updateError) attached += 1;
  }

  return attached;
}

export function buildShopOrderFromProduct(input: {
  product: ShopProduct;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string | null;
  userId?: string | null;
}): ShopOrder {
  const now = new Date().toISOString();
  const normalizedEmail = normalizeContactEmail(input.customerEmail);

  return {
    id: createShopOrderId(),
    userId: input.userId ?? null,
    guestEmail: input.userId ? null : normalizedEmail,
    productId: input.product.id,
    productSlug: input.product.slug,
    productTitle: input.product.title,
    priceUsd: input.product.priceMinor / 100,
    currency: input.product.currency,
    status: "pending",
    paymentStatus: "pending",
    customerName: input.customerName.trim(),
    customerEmail: normalizedEmail,
    customerPhone: input.customerPhone.trim(),
    deliveryUrl: null,
    notes: input.notes?.trim() || null,
    operationVersion: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export async function transitionAdminShopOrderAtomic(
  supabase: DbClient,
  input: {
    orderId: string;
    expectedVersion: number;
    actorUserId: string;
    nextStatus: ShopOrder["status"];
    deliveryUrl: string | null;
    notes: string | null;
    ipAddress?: string | null;
  }
): Promise<{ order: ShopOrder } | { error: string; status: number }> {
  const { data, error } = await supabase.rpc("admin_transition_shop_order_atomic", {
    p_order_id: input.orderId,
    p_expected_version: input.expectedVersion,
    p_actor_user_id: input.actorUserId,
    p_next_status: input.nextStatus,
    p_delivery_url: input.deliveryUrl?.trim() || null,
    p_notes: input.notes?.trim() || null,
    p_ip_address: input.ipAddress ?? null,
  });

  if (error) {
    if (error.code === "40001" || error.message.includes("SHOP_ORDER_CONFLICT")) {
      return {
        error: "Заказ уже изменился в другом окне. Обновите список и повторите действие.",
        status: 409,
      };
    }
    if (error.code === "P0002" || error.message.includes("SHOP_ORDER_NOT_FOUND")) {
      return { error: "Заказ не найден.", status: 404 };
    }
    if (error.message.includes("SHOP_ORDER_PAYMENT_NOT_VERIFIED")) {
      return {
        error: "Оплата ещё не подтверждена платёжной системой. Вручную отметить её полученной нельзя.",
        status: 409,
      };
    }
    if (error.message.includes("SHOP_ORDER_REFUND_REQUIRED")) {
      return {
        error: "Сначала оформите возврат в финансовом разделе, затем отмените заказ.",
        status: 409,
      };
    }
    if (error.code === "23514" || error.message.includes("SHOP_ORDER_INVALID_TRANSITION")) {
      return {
        error: "Такой переход сейчас недоступен. Обновите заказ и выберите предложенное действие.",
        status: 409,
      };
    }
    if (error.code === "22023") {
      return { error: "Проверьте статус, ссылку доставки и заметку.", status: 400 };
    }
    if (error.code === "42501") {
      return { error: "Недостаточно прав для изменения заказа.", status: 403 };
    }
    return { error: "Не удалось сохранить заказ. Попробуйте ещё раз.", status: 500 };
  }

  if (!data) {
    return { error: "База данных не подтвердила изменение заказа.", status: 500 };
  }
  return { order: rowToShopOrder(data) };
}
