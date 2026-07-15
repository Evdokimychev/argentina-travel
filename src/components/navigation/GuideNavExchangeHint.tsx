"use client";

import { useEffect, useState } from "react";
import { formatArsRate } from "@/lib/argentina-exchange-rates";

type OfficialQuote = { ok: true; data: { rate: number } };

function isOfficialQuote(value: unknown): value is OfficialQuote {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as OfficialQuote).ok === true &&
    typeof (value as OfficialQuote).data?.rate === "number" &&
    Number.isFinite((value as OfficialQuote).data.rate)
  );
}

export function GuideNavExchangeHint() {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/exchange-rates/argentina")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: unknown) => {
        if (cancelled || !isOfficialQuote(payload)) return;
        setRate(payload.data.rate);
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
        Курс BCRA · обновляется
      </span>
    );
  }

  return (
    <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-sky">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
      BCRA ≈ {formatArsRate(rate)} / USD
    </span>
  );
}
