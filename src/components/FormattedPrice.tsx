"use client";

import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";

interface FormattedPriceProps {
  priceUsd: number;
  className?: string;
}

export default function FormattedPrice({ priceUsd, className }: FormattedPriceProps) {
  const { formatPrice } = useLocaleCurrency();
  return <span className={className}>{formatPrice(priceUsd)}</span>;
}
