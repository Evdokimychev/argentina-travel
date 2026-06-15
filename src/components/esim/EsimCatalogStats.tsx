"use client";

import { CalendarDays, Database, Globe2, Smartphone, Wifi } from "lucide-react";
import { convertToUsd } from "@/lib/currency";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import type { EsimCatalogSummary } from "@/lib/airalo/types";
import type { CurrencyCode } from "@/types/locale";

type EsimCatalogStatsProps = {
  summary: EsimCatalogSummary;
  labels: {
    packages: string;
    fromPrice: string;
    dataRange: string;
    validityRange: string;
    networks: string;
    unlimited: string;
    days: string;
  };
};

function resolveCurrency(code: string): CurrencyCode {
  const normalized = code.trim().toUpperCase();
  const allowed: CurrencyCode[] = ["RUB", "USD", "EUR", "ARS", "BRL", "CLP", "UYU", "GBP", "CAD", "AUD", "CHF"];
  return allowed.includes(normalized as CurrencyCode) ? (normalized as CurrencyCode) : "USD";
}

function resolveSummaryPriceUsd(summary: EsimCatalogSummary): number | null {
  if (summary.minPrice == null) return null;
  const source = resolveCurrency(summary.currency);
  return source === "USD" ? summary.minPrice : convertToUsd(summary.minPrice, source);
}

export default function EsimCatalogStats({ summary, labels }: EsimCatalogStatsProps) {
  const { formatPrice } = useLocaleCurrency();
  if (!summary.count) return null;

  const minPriceUsd = resolveSummaryPriceUsd(summary);
  const fromPrice = minPriceUsd != null ? formatPrice(minPriceUsd) : null;

  const dataRange =
    summary.hasUnlimited && summary.maxDataGb != null
      ? `${summary.minDataGb}–${summary.maxDataGb} GB + ${labels.unlimited}`
      : summary.hasUnlimited
        ? labels.unlimited
        : summary.minDataGb != null && summary.maxDataGb != null
          ? summary.minDataGb === summary.maxDataGb
            ? `${summary.minDataGb} GB`
            : `${summary.minDataGb}–${summary.maxDataGb} GB`
          : null;

  const validityRange =
    summary.validityRange?.min != null && summary.validityRange.max != null
      ? summary.validityRange.min === summary.validityRange.max
        ? `${summary.validityRange.min} ${labels.days}`
        : `${summary.validityRange.min}–${summary.validityRange.max} ${labels.days}`
      : null;

  const items = [
    {
      icon: Smartphone,
      label: labels.packages,
      value: String(summary.count),
    },
    fromPrice
      ? {
          icon: Wifi,
          label: labels.fromPrice,
          value: fromPrice,
        }
      : null,
    dataRange
      ? {
          icon: Database,
          label: labels.dataRange,
          value: dataRange,
        }
      : null,
    validityRange
      ? {
          icon: CalendarDays,
          label: labels.validityRange,
          value: validityRange,
        }
      : null,
    summary.networks.length
      ? {
          icon: Globe2,
          label: labels.networks,
          value: summary.networks.join(", "),
        }
      : null,
  ].filter(Boolean) as Array<{ icon: typeof Smartphone; label: string; value: string }>;

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card"
        >
          <div className="flex items-center gap-2 text-sky">
            <item.icon className="h-4 w-4" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate">{item.label}</span>
          </div>
          <p className="mt-2 font-heading text-lg font-bold text-charcoal">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
