import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ShopProduct } from "@/data/shop-products";
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
    priceUsd: input.product.price,
    currency: input.product.currency,
    status: "pending",
    paymentStatus: "pending",
    customerName: input.customerName.trim(),
    customerEmail: normalizedEmail,
    customerPhone: input.customerPhone.trim(),
    deliveryUrl: null,
    notes: input.notes?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };
}
