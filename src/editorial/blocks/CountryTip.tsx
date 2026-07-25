import { cn } from "@/lib/cn";
import type { BlogCountryTipVariant, BlogEditorialDensity } from "@/types/blog-content-blocks";

const TITLES: Record<BlogCountryTipVariant, string> = {
  "ru-traveler": "Что важно русскоязычному путешественнику",
  "different-practice": "Что отличается от привычной практики",
  "living-in-argentina": "Если вы живёте в Аргентине",
  "scouting-trip": "Поездка-разведка перед переездом",
};

type Props = {
  variant?: BlogCountryTipVariant;
  title?: string;
  body: string;
  density?: BlogEditorialDensity;
};

export default function CountryTip({
  variant = "ru-traveler",
  title,
  body,
  density = "comfortable",
}: Props) {
  if (!body.trim()) return null;
  const heading = title?.trim() || TITLES[variant];

  return (
    <aside
      className={cn(
        "not-prose rounded-2xl border border-sky/20 bg-sky/[0.04] dark:border-sky/30 dark:bg-sky/[0.08]",
        density === "compact" ? "p-3" : "p-4 sm:p-5",
      )}
      data-editorial-block="country-tip"
      data-variant={variant}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-ink dark:text-sky">
        Контекст для читателя
      </p>
      <h3 className="mt-1 font-heading text-base font-semibold text-charcoal">{heading}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate dark:text-muted">{body}</p>
    </aside>
  );
}
