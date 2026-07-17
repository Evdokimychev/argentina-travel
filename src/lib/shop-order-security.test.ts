import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("shop order creation security", () => {
  it("requires a stable idempotency key, rate limits creation and uses service role", () => {
    const route = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/shop/orders/route.ts"),
      "utf8",
    );
    expect(route).toContain('request.headers.get("idempotency-key")');
    expect(route).toContain("isValidBookingOperationKey");
    expect(route).toContain("withRateLimit");
    expect(route).toContain("createSupabaseAdminClient");
    expect(route).toContain("X-Idempotent-Replay");
  });

  it("revokes direct Data API inserts", () => {
    const migration = fs.readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20260716195954_lock_shop_orders_to_idempotent_server_api.sql",
      ),
      "utf8",
    );
    expect(migration).toContain(
      "revoke insert on table public.shop_orders from anon, authenticated",
    );
    expect(migration).toContain(
      "grant select, insert, update, delete on table public.shop_orders to service_role",
    );
  });

  it("reuses one browser operation key across retry attempts", () => {
    const modal = fs.readFileSync(
      path.join(process.cwd(), "src/components/shop/ShopCheckoutModal.tsx"),
      "utf8",
    );
    expect(modal).toContain("idempotencyKeyRef.current");
    expect(modal).toContain("idempotencyKey: idempotencyKeyRef.current");
  });
});
