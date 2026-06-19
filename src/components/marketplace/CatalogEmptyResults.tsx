"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";

export type CatalogEmptySuggestion = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
};

type CatalogEmptyResultsProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void; variant?: "default" | "outline" };
  secondaryAction?: { label: string; href?: string; onClick?: () => void };
  suggestions?: CatalogEmptySuggestion[];
  suggestionsTitle?: string;
  className?: string;
};

function SuggestionPill({ suggestion }: { suggestion: CatalogEmptySuggestion }) {
  const className =
    "inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-charcoal transition-colors hover:border-sky/30 hover:bg-sky/5 hover:text-sky";

  if (suggestion.href) {
    return (
      <Link href={suggestion.href} className={className}>
        {suggestion.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={suggestion.onClick} className={className}>
      {suggestion.label}
    </button>
  );
}

export default function CatalogEmptyResults({
  icon,
  title,
  description,
  action,
  secondaryAction,
  suggestions = [],
  suggestionsTitle = "Попробуйте",
  className,
}: CatalogEmptyResultsProps) {
  return (
    <div className={cn("mt-8", className)}>
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={action}
        secondaryAction={secondaryAction}
        variant="catalog"
      />
      {suggestions.length > 0 ? (
        <div className="mt-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-slate">{suggestionsTitle}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {suggestions.map((suggestion) => (
              <SuggestionPill key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
