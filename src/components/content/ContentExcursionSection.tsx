import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import ExcursionCard from "@/components/excursions/ExcursionCard";
import type { ContentExcursionMatch } from "@/lib/content-excursion-match";
import { cn } from "@/lib/cn";

type ContentExcursionSectionProps = {
  matches: ContentExcursionMatch[];
  title?: string;
  subtitle?: string;
  className?: string;
};

export default function ContentExcursionSection({
  matches,
  title = "Экскурсии по теме",
  subtitle = "Предложения из актуального каталога Tripster и Sputnik8",
  className,
}: ContentExcursionSectionProps) {
  if (matches.length === 0) return null;

  return (
    <section className={cn("min-w-0", className)} aria-labelledby="content-excursions-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="content-excursions-title" className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate">{subtitle}</p>
        </div>
        <Link
          href="/excursions"
          className="inline-flex items-center gap-1 text-sm font-semibold text-sky-ink hover:underline"
        >
          Все экскурсии
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="-mx-1 mt-5 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
        <ul className="flex snap-x snap-mandatory gap-4">
          {matches.map((match) => (
            <li
              key={`${match.excursion.partner}:${match.excursion.slug}`}
              className="flex w-[min(84vw,19rem)] shrink-0 snap-start flex-col sm:w-80"
            >
              <ExcursionCard excursion={match.excursion} />
              <p className="mx-1 mt-2 flex items-start gap-1.5 rounded-xl bg-sky/5 px-3 py-2 text-xs leading-relaxed text-sky-ink">
                <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky" aria-hidden />
                <span>
                  <span className="font-semibold">Почему подходит:</span>{" "}
                  {match.reasons.join(". ")}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
