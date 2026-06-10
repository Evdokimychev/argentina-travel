import Link from "next/link";
import { Check, MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { TravelHubContent } from "@/types/guide-travel-hub";

type GuideGuidedTransferBlockProps = {
  block: NonNullable<TravelHubContent["guidedAirportTransfers"]>;
};

export default function GuideGuidedTransferBlock({ block }: GuideGuidedTransferBlockProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-sky/20 bg-gradient-to-br from-sky/8 via-white to-patagonia/5 shadow-sm">
      <div className="border-b border-sky/10 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-xl">
            🚕
          </span>
          <div>
            <p className="font-display text-lg font-bold text-charcoal">{block.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate">{block.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        {block.options.map((option) => (
          <article
            key={option.id}
            className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky">
                  {option.airportCode}
                </p>
                <p className="mt-0.5 font-display text-base font-bold text-charcoal">
                  {option.airportLabel}
                </p>
                <p className="mt-1 text-xs text-slate">{option.route}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-bold tabular-nums text-charcoal">
                  ${option.priceUsd}
                </p>
                <p className="text-[11px] text-slate">USD · фикс. цена</p>
              </div>
            </div>

            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              Русскоязычный гид-водитель
            </p>

            <ul className="mt-4 flex-1 space-y-2">
              {option.highlights.map((item) => (
                <li key={item} className="flex gap-2 text-xs leading-relaxed text-charcoal">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-3 text-xs text-slate">{option.duration}</p>

            <Link
              href={option.href}
              className={cn(buttonVariants(), "mt-4 w-full rounded-full")}
            >
              Заказать · {option.airportCode}
            </Link>
          </article>
        ))}
      </div>

      <div className="border-t border-sky/10 bg-white/60 px-5 py-3 text-center sm:px-6">
        <Link
          href={block.options[0]?.href ?? "/contacts?service=airport-transfer"}
          className="text-sm font-medium text-sky hover:underline"
        >
          {block.ctaLabel}
        </Link>
      </div>
    </div>
  );
}
