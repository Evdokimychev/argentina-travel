import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface TourEmbedSectionHeaderProps {
  title: string;
  subtitle?: string;
  catalogHref?: string;
  catalogLabel?: string;
  compact?: boolean;
  className?: string;
}

export default function TourEmbedSectionHeader({
  title,
  subtitle,
  catalogHref,
  catalogLabel = "Все туры",
  compact = false,
  className,
}: TourEmbedSectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4", compact ? "mb-4" : "mb-6", className)}>
      <div className="min-w-0">
        <h2
          className={cn(
            "font-heading font-bold text-charcoal",
            compact ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"
          )}
        >
          {title}
        </h2>
        {subtitle ? (
          <p
            className={cn(
              "mt-1.5 leading-relaxed text-slate",
              compact ? "text-sm" : "text-sm sm:text-base"
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {catalogHref ? (
        <Link
          href={catalogHref}
          className="hidden shrink-0 items-center gap-1 text-sm font-medium text-sky hover:underline sm:inline-flex"
        >
          {catalogLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
