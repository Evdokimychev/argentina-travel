import { describe, expect, it } from "vitest";
import { calculateCommissionSplit } from "@/lib/payments/commission-server";
import {
  mapMercadoPagoCapturePhase,
  mapMercadoPagoToBookingPaymentStatus,
} from "@/lib/payments/mercadopago-client";
import type { PlatformCommissionRuleRow } from "@/types/platform-commission";

const percentRule: PlatformCommissionRuleRow = {
  id: "rule-percent",
  name: "Стандарт 12%",
  ruleType: "percent",
  percentValue: 12,
  fixedAmount: null,
  fixedCurrency: "USD",
  isDefault: true,
  active: true,
  utmSourceMatch: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("Mercado Pago booking payment status mapping", () => {
  it("maps approved capture to paid", () => {
    expect(mapMercadoPagoToBookingPaymentStatus("approved")).toBe("paid");
    expect(mapMercadoPagoCapturePhase("approved")).toBe("captured");
  });

  it("maps partially paid detail to partial", () => {
    expect(mapMercadoPagoToBookingPaymentStatus("pending", "partially_paid")).toBe("partial");
  });

  it("maps refunded status to refunded", () => {
    expect(mapMercadoPagoToBookingPaymentStatus("refunded")).toBe("refunded");
  });

  it("never marks paid on pending authorization", () => {
    expect(mapMercadoPagoToBookingPaymentStatus("authorized")).toBe("pending");
    expect(mapMercadoPagoToBookingPaymentStatus("pending")).toBe("pending");
  });
});

describe("commission split for sandbox charges", () => {
  it("computes percent commission snapshot amounts", () => {
    const split = calculateCommissionSplit(1000, percentRule);
    expect(split.commissionAmount).toBe(120);
    expect(split.organizerNetAmount).toBe(880);
    expect(split.commissionPercent).toBe(12);
  });

  it("caps fixed commission at gross amount", () => {
    const split = calculateCommissionSplit(
      50,
      {
        ...percentRule,
        id: "rule-fixed",
        ruleType: "fixed",
        percentValue: null,
        fixedAmount: 80,
      }
    );
    expect(split.commissionAmount).toBe(50);
    expect(split.organizerNetAmount).toBe(0);
  });
});
