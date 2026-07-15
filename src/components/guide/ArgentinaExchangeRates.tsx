import { Suspense } from "react";
import { AlertCircle, Banknote, RefreshCw, TrendingUp } from "lucide-react";
import {
  formatArsRate,
  formatExchangeRateUpdatedAt,
  getArgentinaExchangeRates,
} from "@/lib/argentina-exchange-rates";

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
            Официальный справочный курс BCRA
          </h2>
          <p className="mt-1 text-sm text-slate">
            Котировка аргентинских песо за 1 USD из статистики Центрального банка Аргентины.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-gray-100 bg-surface-muted/60 p-5">
        <dl className="flex flex-wrap items-baseline justify-between gap-3">
          <dt className="text-sm font-medium text-slate">Официальная справочная котировка</dt>
          <dd className="font-heading text-2xl font-bold tabular-nums text-charcoal">
            {formatArsRate(data.rate)} за 1 USD
          </dd>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-slate">
          Это не банковский курс покупки или продажи, не курс международной карты и не MEP.
          Итоговый пересчёт зависит от банка, платёжной системы и конкретной операции.
        </p>
      </div>

      <footer className="mt-5 flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-1.5 text-xs text-slate">
          <Banknote className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Данные на {formatExchangeRateUpdatedAt(data.observedAt)} (Буэнос-Айрес)
        </p>
        <div className="flex flex-wrap items-center gap-3 text-[11px] leading-snug text-slate">
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-slate/30 underline-offset-2 hover:decoration-slate"
          >
            Источник: BCRA
          </a>
          <a href="?refresh=1" className="inline-flex items-center gap-1 underline decoration-slate/30 underline-offset-2">
            <RefreshCw className="h-3 w-3" aria-hidden />
            Обновить
          </a>
          <span>Справочно, не является финансовой рекомендацией</span>
        </div>
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
