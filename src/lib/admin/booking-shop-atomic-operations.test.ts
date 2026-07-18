import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getAdminBookingStatusTransitions } from "@/data/booking-statuses";
import { getAdminShopOrderTransitions } from "@/types/shop-order";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("booking and shop atomic operations", () => {
  const migration = source(
    "supabase/migrations/20260717045000_booking_shop_atomic_transitions.sql",
  );

  it("keeps booking transition, reservation release, audit and outbox atomic", () => {
    expect(migration).toContain("public.admin_transition_booking_atomic");
    expect(migration).toContain("for update;");
    expect(migration).toContain("BOOKING_CONFLICT");
    expect(migration).toContain("cancel_booking_with_reservation_release");
    expect(migration).toContain("insert into public.admin_audit_log");
    expect(migration).toContain("insert into public.operations_transition_outbox");
    expect(migration).toContain("'customer', 'organizer'");
    expect(migration).toContain("paymentStatusPreserved");
  });

  it("does not let an admin invent payment truth", () => {
    const bookingRoute = source("src/app/api/admin/bookings/[id]/route.ts");
    const shopRoute = source("src/app/api/admin/shop/orders/[id]/route.ts");

    expect(migration).toContain("BOOKING_PAID_STATUS_PAYMENT_OWNED");
    expect(migration).toContain("SHOP_ORDER_PAYMENT_NOT_VERIFIED");
    expect(migration).toContain("SHOP_ORDER_REFUND_REQUIRED");
    const shopRpcBody = migration.slice(
      migration.indexOf("create or replace function public.admin_transition_shop_order_atomic"),
      migration.indexOf("revoke all on function public.admin_transition_booking_atomic"),
    );
    expect(shopRpcBody).not.toContain("set payment_status =");
    expect(shopRoute).toContain("body.paymentStatus !== undefined");
    expect(shopRoute).not.toContain('.from("shop_orders").update');
    expect(bookingRoute).not.toContain("updateBookingRecord");
    expect(bookingRoute).not.toContain("writeAdminAuditLog");
  });

  it("uses explicit owner-facing state machine options", () => {
    expect(getAdminBookingStatusTransitions("waiting_payment", "pending")).toEqual([
      "cancelled",
    ]);
    expect(getAdminBookingStatusTransitions("waiting_payment", "paid")).toEqual([
      "completed",
      "cancelled",
    ]);
    expect(getAdminBookingStatusTransitions("paid", "paid")).toEqual([
      "completed",
      "cancelled",
    ]);

    expect(getAdminShopOrderTransitions({ status: "awaiting_payment", paymentStatus: "pending" }))
      .toEqual(["cancelled"]);
    expect(getAdminShopOrderTransitions({ status: "awaiting_payment", paymentStatus: "paid" }))
      .toEqual(["paid"]);
    expect(getAdminShopOrderTransitions({ status: "pending", paymentStatus: "paid" }))
      .toEqual(["awaiting_payment"]);
    expect(getAdminShopOrderTransitions({ status: "paid", paymentStatus: "paid" }))
      .toEqual(["delivered"]);
  });

  it("sends CAS versions and asks for confirmation in both admin screens", () => {
    const bookingView = source("src/components/admin/views/BookingsView.tsx");
    const shopView = source("src/components/admin/views/ShopOrdersView.tsx");

    expect(bookingView).toContain("expectedVersion: booking.operationVersion");
    expect(shopView).toContain("expectedVersion: selected.operationVersion");
    expect(bookingView).toContain("window.confirm");
    expect(shopView).toContain("window.confirm");
    expect(shopView).not.toContain("paymentStatus: draft.paymentStatus");
  });

  it("keeps RPCs service-only and the outbox PII-free", () => {
    expect(migration).toContain("to service_role;");
    expect(migration).toContain("from public, anon, authenticated;");
    expect(migration).toContain("contactEmail");
    expect(migration).toContain("deliveryUrl");
    expect(migration).toContain("trusted workers resolve recipients after commit");
  });
});
