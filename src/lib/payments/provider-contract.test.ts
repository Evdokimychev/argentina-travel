import { describe, expect, it } from "vitest";
import {
  PAYMENT_PROVIDER_MODES,
  PAYMENT_SETTLEMENT_MODELS,
  canStartProviderCheckout,
  definePaymentProviderCatalog,
  findPaymentProvider,
  isOnlinePaymentProvider,
  type PaymentProviderContract,
} from "./provider-contract";

const onlineProvider: PaymentProviderContract = {
  id: "online-provider",
  displayName: "Онлайн-провайдер",
  mode: "online",
  settlementModel: "platform_merchant",
  supportedCurrencies: ["RUB"],
  capabilities: {
    checkout: true,
    signedWebhooks: true,
    refunds: true,
    partialRefunds: true,
    reconciliation: true,
  },
};

const manualProvider: PaymentProviderContract = {
  id: "manual",
  displayName: "Оплата по инструкции",
  mode: "manual",
  settlementModel: "manual_off_platform",
  supportedCurrencies: ["RUB", "ARS"],
  capabilities: {
    checkout: false,
    signedWebhooks: false,
    refunds: false,
    partialRefunds: false,
    reconciliation: true,
  },
};

const plannedProvider: PaymentProviderContract = {
  id: "future-provider",
  displayName: "Будущий провайдер",
  mode: "planned",
  plannedMode: "online",
  settlementModel: "undecided",
  supportedCurrencies: ["ARS"],
  capabilities: {
    checkout: false,
    signedWebhooks: false,
    refunds: false,
    partialRefunds: false,
    reconciliation: false,
  },
};

describe("provider-neutral payment contracts", () => {
  it("keeps operating modes and settlement models explicit", () => {
    expect(PAYMENT_PROVIDER_MODES).toEqual(["online", "manual", "planned"]);
    expect(PAYMENT_SETTLEMENT_MODELS).toEqual([
      "platform_merchant",
      "organizer_direct",
      "marketplace_split",
      "manual_off_platform",
      "undecided",
    ]);
  });

  it("finds a known provider and fails closed for unknown or malformed ids", () => {
    const catalog = definePaymentProviderCatalog([
      onlineProvider,
      manualProvider,
      plannedProvider,
    ]);
    expect(findPaymentProvider(catalog, " ONLINE-PROVIDER ")).toEqual(catalog.entries[0]);
    expect(findPaymentProvider(catalog, "missing-provider")).toBeUndefined();
    expect(findPaymentProvider(catalog, "not valid")).toBeUndefined();
  });

  it("allows checkout only for an online provider", () => {
    expect(isOnlinePaymentProvider(onlineProvider)).toBe(true);
    expect(canStartProviderCheckout(onlineProvider)).toBe(true);
    expect(canStartProviderCheckout(manualProvider)).toBe(false);
    expect(canStartProviderCheckout(plannedProvider)).toBe(false);
  });

  it("builds a normalized immutable provider catalog", () => {
    const catalog = definePaymentProviderCatalog([
      { ...onlineProvider, id: " ONLINE-PROVIDER ", displayName: " Онлайн-провайдер " },
      manualProvider,
      plannedProvider,
    ]);

    expect(catalog.entries.map((entry) => entry.id)).toEqual([
      "online-provider",
      "manual",
      "future-provider",
    ]);
    expect(catalog.entries[0]?.displayName).toBe("Онлайн-провайдер");
    expect(Object.isFrozen(catalog)).toBe(true);
    expect(Object.isFrozen(catalog.entries)).toBe(true);
    expect(Object.isFrozen(catalog.entries[0]?.capabilities)).toBe(true);
  });

  it("rejects duplicate ids, invalid ids, duplicate currencies and blank names", () => {
    expect(() => definePaymentProviderCatalog([onlineProvider, onlineProvider])).toThrow(
      /Duplicate payment provider id/,
    );
    expect(() =>
      definePaymentProviderCatalog([{ ...onlineProvider, id: "not valid" }]),
    ).toThrow(/Invalid payment provider id/);
    expect(() =>
      definePaymentProviderCatalog([
        { ...onlineProvider, supportedCurrencies: ["RUB", "RUB"] },
      ]),
    ).toThrow(/duplicate currencies/);
    expect(() =>
      definePaymentProviderCatalog([{ ...onlineProvider, displayName: " " }]),
    ).toThrow(/display name/);
    expect(() =>
      definePaymentProviderCatalog([{ ...onlineProvider, supportedCurrencies: [] }]),
    ).toThrow(/must support a currency/);
    expect(() =>
      definePaymentProviderCatalog([
        {
          ...onlineProvider,
          supportedCurrencies: ["GBP"],
        } as unknown as PaymentProviderContract,
      ]),
    ).toThrow(/unsupported currency/);
    expect(() =>
      definePaymentProviderCatalog([
        {
          ...plannedProvider,
          settlementModel: "platform_merchant",
        } as unknown as PaymentProviderContract,
      ]),
    ).toThrow(/settlement undecided/);
    expect(() =>
      definePaymentProviderCatalog([
        {
          ...manualProvider,
          capabilities: { ...manualProvider.capabilities, checkout: true },
        } as unknown as PaymentProviderContract,
      ]),
    ).toThrow(/cannot enable checkout/);
  });
});
