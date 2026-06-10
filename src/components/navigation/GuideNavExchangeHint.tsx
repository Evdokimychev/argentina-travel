"use client";

import { useEffect, useState } from "react";
import { formatArsRate } from "@/lib/argentina-exchange-rates";

type BlueQuote = { sell: number };

function isBlueQuote(value: unknown): value is BlueQuote {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as BlueQuote).sell === "number" &&
    Number.isFinite((value as BlueQuote).sell)
  );
}

export function GuideNavExchangeHint() {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("https://dolarapi.com/v1/dolares/blue")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: unknown) => {
        if (cancelled || !isBlueQuote(payload)) return;
        setRate(payload.sell);
      })
      .catch(() => {
        /* silent — hint is optional */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (rate === null) {
    return (
      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-sky">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky" aria-hidden />
        Курс blue · live
      </span>
    );
  }

  return (
    <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-sky">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
      Blue ≈ {formatArsRate(rate)} / USD
    </span>
  );
}
