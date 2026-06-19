import { isSupabaseShopEnabled } from "@/lib/auth-mode";
import type { ShopOrder } from "@/types/shop-order";

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return body;
}

export type CreateShopOrderInput = {
  productSlug: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
};

export async function apiCreateShopOrder(input: CreateShopOrderInput): Promise<ShopOrder> {
  const data = await parseJson<{ order: ShopOrder }>(
    await fetch("/api/shop/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.order;
}

export async function apiFetchUserShopOrders(): Promise<ShopOrder[]> {
  const data = await parseJson<{ orders: ShopOrder[] }>(await fetch("/api/shop/orders"));
  return data.orders;
}

export async function apiFetchShopOrderById(orderId: string): Promise<ShopOrder | null> {
  const response = await fetch(`/api/shop/orders/${encodeURIComponent(orderId)}`);
  if (response.status === 404) return null;
  const data = await parseJson<{ order: ShopOrder }>(response);
  return data.order;
}

export function isRemoteShopMode(): boolean {
  return isSupabaseShopEnabled();
}
