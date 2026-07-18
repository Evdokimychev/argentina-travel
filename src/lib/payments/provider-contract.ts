import { MONEY_MINOR_UNIT_EXPONENT, type MoneyCurrency } from "./money";

export const PAYMENT_PROVIDER_MODES = ["online", "manual", "planned"] as const;
export type PaymentProviderMode = (typeof PAYMENT_PROVIDER_MODES)[number];

export const PAYMENT_SETTLEMENT_MODELS = [
  "platform_merchant",
  "organizer_direct",
  "marketplace_split",
  "manual_off_platform",
  "undecided",
] as const;
export type PaymentSettlementModel = (typeof PAYMENT_SETTLEMENT_MODELS)[number];

interface PaymentProviderBase {
  readonly id: string;
  readonly displayName: string;
  readonly settlementModel: PaymentSettlementModel;
  readonly supportedCurrencies: readonly MoneyCurrency[];
}

export interface OnlinePaymentProviderContract extends PaymentProviderBase {
  readonly mode: "online";
  readonly settlementModel: Exclude<PaymentSettlementModel, "undecided">;
  readonly capabilities: {
    readonly checkout: true;
    readonly signedWebhooks: boolean;
    readonly refunds: boolean;
    readonly partialRefunds: boolean;
    readonly reconciliation: boolean;
  };
}

export interface ManualPaymentProviderContract extends PaymentProviderBase {
  readonly mode: "manual";
  readonly settlementModel: Exclude<PaymentSettlementModel, "undecided">;
  readonly capabilities: {
    readonly checkout: false;
    readonly signedWebhooks: false;
    readonly refunds: false;
    readonly partialRefunds: false;
    readonly reconciliation: boolean;
  };
}

export interface PlannedPaymentProviderContract extends PaymentProviderBase {
  readonly mode: "planned";
  readonly settlementModel: "undecided";
  readonly plannedMode: Exclude<PaymentProviderMode, "planned">;
  readonly capabilities: {
    readonly checkout: false;
    readonly signedWebhooks: false;
    readonly refunds: false;
    readonly partialRefunds: false;
    readonly reconciliation: false;
  };
}

export type PaymentProviderContract =
  | OnlinePaymentProviderContract
  | ManualPaymentProviderContract
  | PlannedPaymentProviderContract;

export interface PaymentProviderCatalog {
  readonly entries: readonly PaymentProviderContract[];
}

function normalizedProviderId(id: string): string {
  const normalized = id.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    throw new TypeError(`Invalid payment provider id: ${id}`);
  }
  return normalized;
}

function uniqueCurrencies(
  currencies: readonly MoneyCurrency[],
  providerId: string,
): readonly MoneyCurrency[] {
  for (const currency of currencies) {
    if (!(currency in MONEY_MINOR_UNIT_EXPONENT)) {
      throw new TypeError(`Payment provider ${providerId} has unsupported currency: ${currency}`);
    }
  }
  const unique = [...new Set(currencies)];
  if (unique.length !== currencies.length) {
    throw new TypeError(`Payment provider ${providerId} has duplicate currencies.`);
  }
  return Object.freeze(unique);
}

export function definePaymentProviderCatalog(
  entries: readonly PaymentProviderContract[],
): PaymentProviderCatalog {
  const ids = new Set<string>();
  const normalizedEntries = entries.map((entry) => {
    const id = normalizedProviderId(entry.id);
    if (ids.has(id)) throw new TypeError(`Duplicate payment provider id: ${id}`);
    ids.add(id);

    if (!entry.displayName.trim()) {
      throw new TypeError(`Payment provider ${id} must have a display name.`);
    }
    if (!PAYMENT_PROVIDER_MODES.includes(entry.mode)) {
      throw new TypeError(`Payment provider ${id} has an invalid mode.`);
    }
    if (!PAYMENT_SETTLEMENT_MODELS.includes(entry.settlementModel)) {
      throw new TypeError(`Payment provider ${id} has an invalid settlement model.`);
    }
    if (entry.mode === "online" && entry.supportedCurrencies.length === 0) {
      throw new TypeError(`Online payment provider ${id} must support a currency.`);
    }
    if (entry.mode === "planned") {
      if (entry.settlementModel !== "undecided") {
        throw new TypeError(`Planned payment provider ${id} must keep settlement undecided.`);
      }
      if (entry.plannedMode !== "online" && entry.plannedMode !== "manual") {
        throw new TypeError(`Planned payment provider ${id} has an invalid planned mode.`);
      }
    } else if (String(entry.settlementModel) === "undecided") {
      throw new TypeError(`Active payment provider ${id} must define settlement.`);
    }

    const capabilities = entry.capabilities;
    if (entry.mode === "online" && capabilities.checkout !== true) {
      throw new TypeError(`Online payment provider ${id} must enable checkout capability.`);
    }
    if (entry.mode !== "online" && capabilities.checkout !== false) {
      throw new TypeError(`Non-online payment provider ${id} cannot enable checkout.`);
    }

    return Object.freeze({
      ...entry,
      id,
      displayName: entry.displayName.trim(),
      supportedCurrencies: uniqueCurrencies(entry.supportedCurrencies, id),
      capabilities: Object.freeze({ ...entry.capabilities }),
    }) as PaymentProviderContract;
  });

  return Object.freeze({ entries: Object.freeze(normalizedEntries) });
}

export function isOnlinePaymentProvider(
  provider: PaymentProviderContract,
): provider is OnlinePaymentProviderContract {
  return provider.mode === "online";
}

export function canStartProviderCheckout(provider: PaymentProviderContract): boolean {
  return isOnlinePaymentProvider(provider) && provider.capabilities.checkout;
}

export function findPaymentProvider(
  catalog: PaymentProviderCatalog,
  providerId: string,
): PaymentProviderContract | undefined {
  let normalized: string;
  try {
    normalized = normalizedProviderId(providerId);
  } catch {
    return undefined;
  }
  return catalog.entries.find((entry) => entry.id === normalized);
}
