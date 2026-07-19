import { parseMoneyCurrency } from "@/lib/payments/money";

export function formatLedgerAmount(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) return "Некорректная сумма";

  const supportedCurrency = parseMoneyCurrency(currency);
  if (supportedCurrency) {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: supportedCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  const amountLabel = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  const currencyLabel = currency.trim().toUpperCase() || "валюта не указана";
  return `${amountLabel} ${currencyLabel}`;
}
