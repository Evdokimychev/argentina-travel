import Link from "next/link";
import { ExternalLink, Plane } from "lucide-react";
import FlightPriceTeaserGrid from "@/components/flights/FlightPriceTeaserGrid";
import { buttonVariants } from "@/components/ui/button";
import { getFlightTeaserLabels } from "@/lib/flights/teaser-labels";
import { t } from "@/lib/i18n";
import ru from "@/locales/ru/common.json";
import en from "@/locales/en/common.json";
import es from "@/locales/es/common.json";
import pt from "@/locales/pt/common.json";
import { cn } from "@/lib/utils";
import type { LocaleCode } from "@/types/locale";

const MESSAGE_BY_LOCALE = { ru, en, es, pt } as const;

type FlightHubAviasalesSectionProps = {
  benefits: string[];
  locale?: LocaleCode;
};

export default function FlightHubAviasalesSection({
  benefits,
  locale = "ru",
}: FlightHubAviasalesSectionProps) {
  const labels = getFlightTeaserLabels(locale);
  const messages = MESSAGE_BY_LOCALE[locale] ?? ru;
  const intro = t(messages, "flights.intro");

  return (
    <div className="overflow-hidden rounded-3xl border border-sky/20 bg-gradient-to-br from-sky/10 via-white to-sky/5 p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-sky">
            <Plane className="h-6 w-6" aria-hidden />
            <span className="font-heading text-lg font-bold text-charcoal">Aviasales</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate">{intro}</p>
          <ul className="mt-4 space-y-2">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-sm text-charcoal">
                <span className="text-sky">✔</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
        <Link
          href="/flights?origin=MOW&destination=BUE"
          className={cn(
            buttonVariants({ variant: "default" }),
            "shrink-0 rounded-full px-8 py-6 text-base lg:self-center"
          )}
        >
          {labels.fullSearch}
          <ExternalLink className="ml-2 h-4 w-4" />
        </Link>
      </div>

      <FlightPriceTeaserGrid className="mt-8 border-t border-sky/15 pt-6" locale={locale} />
    </div>
  );
}
