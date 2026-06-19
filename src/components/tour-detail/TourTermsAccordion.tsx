"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  inferExcludedTermIcon,
  inferIncludedTermIcon,
  parseTourTermItems,
  type ParsedTourTermItem,
} from "@/lib/tour-terms-items";
import { cn } from "@/lib/cn";

interface TourTermsAccordionProps {
  title: string;
  items: string[];
  variant: "included" | "excluded";
  className?: string;
}

function TermRow({
  item,
  variant,
  isOpen,
  onToggle,
  showDivider,
}: {
  item: ParsedTourTermItem;
  variant: "included" | "excluded";
  isOpen: boolean;
  onToggle: () => void;
  showDivider: boolean;
}) {
  const hasDetail = Boolean(item.detail?.trim());
  const Icon = variant === "included" ? inferIncludedTermIcon(item.title) : inferExcludedTermIcon(item.title);

  const iconWrapClass =
    variant === "included"
      ? "bg-success/10 text-success"
      : "bg-gray-100 text-slate";

  const content = (
    <>
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          iconWrapClass
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="block text-sm font-medium leading-snug text-charcoal">{item.title}</span>
        {hasDetail && isOpen ? (
          <span className="mt-1.5 block animate-fade-in-up text-xs leading-relaxed text-slate">
            {item.detail}
          </span>
        ) : null}
      </span>
      {hasDetail ? (
        <ChevronDown
          className={cn(
            "mt-1 h-4 w-4 shrink-0 text-slate transition-transform",
            isOpen && "rotate-180"
          )}
          aria-hidden
        />
      ) : null}
    </>
  );

  if (!hasDetail) {
    return (
      <li className={cn("flex items-start gap-2.5 py-2.5", showDivider && "border-t border-black/[0.06]")}>
        {content}
      </li>
    );
  }

  return (
    <li className={cn(showDivider && "border-t border-black/[0.06]")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start gap-2.5 py-2.5 text-left transition-colors hover:bg-black/[0.02]"
      >
        {content}
      </button>
    </li>
  );
}

export default function TourTermsAccordion({ title, items, variant, className }: TourTermsAccordionProps) {
  const parsed = useMemo(() => parseTourTermItems(items), [items]);
  const expandableIndexes = useMemo(
    () =>
      parsed
        .map((item, index) => (item.detail?.trim() ? index : -1))
        .filter((index) => index >= 0),
    [parsed]
  );
  const hasExpandable = expandableIndexes.length > 0;

  const [openMap, setOpenMap] = useState<Record<number, boolean>>({});
  const allExpanded =
    hasExpandable && expandableIndexes.every((index) => openMap[index]);

  function toggleIndex(index: number) {
    setOpenMap((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  function toggleAll() {
    if (!hasExpandable) return;
    if (allExpanded) {
      setOpenMap({});
      return;
    }
    const next: Record<number, boolean> = {};
    for (const index of expandableIndexes) next[index] = true;
    setOpenMap(next);
  }

  if (!parsed.length) return null;

  const shellClass =
    variant === "included"
      ? "border-success/20 bg-success-muted"
      : "border-gray-100 bg-surface-muted/40";

  return (
    <div className={cn("rounded-2xl border p-4 sm:p-5", shellClass, className)}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-heading text-lg font-bold text-charcoal">{title}</h3>
        {hasExpandable ? (
          <button
            type="button"
            onClick={toggleAll}
            className="shrink-0 pt-0.5 text-xs font-semibold text-brand transition-colors hover:text-brand/80"
          >
            {allExpanded ? "Свернуть все" : "Развернуть все"}
          </button>
        ) : null}
      </div>

      <ul className="mt-2">
        {parsed.map((item, index) => (
          <TermRow
            key={`${item.title}-${index}`}
            item={item}
            variant={variant}
            isOpen={Boolean(openMap[index])}
            onToggle={() => toggleIndex(index)}
            showDivider={index > 0}
          />
        ))}
      </ul>
    </div>
  );
}
