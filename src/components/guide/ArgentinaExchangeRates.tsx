import { Suspense } from "react";
import { AlertCircle, Banknote, TrendingUp } from "lucide-react";
import {
  formatArsRate,
  formatExchangeRateUpdatedAt,
  getArgentinaExchangeRates,
  latestExchangeRateUpdate,
  type ExchangeRateQuote,
} from "@/lib/argentina-exchange-rates";
import { cn } from "@/lib/cn";

function RateColumn({
  label,
  quote,
  accentClass,
}: {
  label: string;
  quote: ExchangeRateQuote;
  accentClass: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-surface-muted/60 p-4">
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", accentClass)} aria-hidden />
        <h3 className="font-heading text-sm font-bold text-charcoal">{label}</h3>
      </div>
      <dl className="mt-3 space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs text-slate">Покупка</dt>
          <dd className="font-heading text-lg font-bold tabular-nums text-charcoal">
            {formatArsRate(quote.buy)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs text-slate">Продажа</dt>
          <dd className="font-heading text-lg font-bold tabular-nums text-sky">
            {formatArsRate(quote.sell)}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-[11px] text-slate">
        за 1 USD · обновлено{" "}
        {formatExchangeRateUpdatedAt(quote.updatedAt)}
      </p>
    </div>
  );
}

export function ArgentinaExchangeRatesSkeleton() {
  return (
    <section
      className="mt-8 max-w-3xl animate-pulse rounded-2xl border border-gray-100 bg-white p-6 shadow-card sm:p-8"
      aria-busy="true"
      aria-label="Загрузка курсов доллара"
    >
      <div className="h-5 w-48 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-full max-w-md rounded bg-gray-100" />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="h-36 rounded-xl bg-gray-100" />
        <div className="h-36 rounded-xl bg-gray-100" />
      </div>
    </section>
  );
}

function ExchangeRatesUnavailable() {
  return (
    <section
      className="mt-8 max-w-3xl rounded-2xl border border-amber-200/80 bg-amber-50/50 p-6 shadow-card sm:p-8"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        <div>
          <h2 className="font-heading text-lg font-bold text-charcoal">Курс доллара сегодня</h2>
          <p className="mt-2 text-sm text-slate">
            Не удалось загрузить актуальные курсы. Попробуйте обновить страницу позже.
          </p>
        </div>
      </div>
    </section>
  );
}

async function ArgentinaExchangeRatesContent() {
  let result;
  try {
    result = await getArgentinaExchangeRates();
  } catch {
    return <ExchangeRatesUnavailable />;
  }

  if (!result.ok) {
    return <ExchangeRatesUnavailable />;
  }

  const { data } = result;
  const lastUpdated = latestExchangeRateUpdate(data);

  return (
    <section
      className="mt-8 max-w-3xl rounded-2xl border border-gray-100 bg-white p-6 shadow-card sm:p-8"
      aria-labelledby="exchange-rates-title"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky/10">
          <TrendingUp className="h-5 w-5 text-sky" aria-hidden />
        </div>
        <div>
          <h2
            id="exchange-rates-title"
            className="font-heading text-lg font-bold text-charcoal"
          >
            Курс доллара сегодня
          </h2>
          <p className="mt-1 text-sm text-slate">
            Справочные котировки в аргентинских песо за 1 USD. Официальный и параллельный
            («синий») рынок часто расходятся — учитывайте оба при планировании бюджета.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <RateColumn label="Официальный" quote={data.oficial} accentClass="bg-sky" />
        <RateColumn label="Синий (paralelo)" quote={data.blue} accentClass="bg-patagonia" />
      </div>

      <footer className="mt-5 flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-1.5 text-xs text-slate">
          <Banknote className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Обновлено: {formatExchangeRateUpdatedAt(lastUpdated)} (Буэнос-Айрес)
        </p>
        <p className="text-[11px] leading-snug text-slate">
          Справочно, не является финансовой рекомендацией
        </p>
      </footer>
    </section>
  );
}

export default function ArgentinaExchangeRates() {
  return (
    <Suspense fallback={<ArgentinaExchangeRatesSkeleton />}>
      <ArgentinaExchangeRatesContent />
    </Suspense>
  );
}
