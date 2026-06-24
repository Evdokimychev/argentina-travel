"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import TourSection from "./TourSection";
import TourSectionExpandToggle from "./TourSectionExpandToggle";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import { cn } from "@/lib/cn";

function formatImportantExpandStatus(
  openCount: number,
  totalCount: number,
  allExpanded: boolean,
): string {
  if (allExpanded) return "Показаны все блоки";
  if (openCount === 0) return "Все блоки свёрнуты";
  if (openCount === 1) return "Открыт только один блок";
  return `Открыто ${openCount} из ${totalCount}`;
}

export default function PartnerTourImportantSection({
  content,
}: {
  content: PartnerTourContent;
}) {
  const items = content.importantToKnowItems ?? [];

  const visibleItems = useMemo(
    () => items.filter((item) => item.title.trim() && item.html.trim()),
    [items],
  );

  const [openIndexes, setOpenIndexes] = useState<Set<number>>(() => new Set());

  const totalCount = visibleItems.length;
  const openCount = openIndexes.size;
  const allExpanded = totalCount > 0 && openCount === totalCount;

  const openSegments = useMemo(
    () => visibleItems.map((_, index) => openIndexes.has(index)),
    [visibleItems, openIndexes],
  );

  if (!visibleItems.length) return null;

  function toggleIndex(index: number) {
    setOpenIndexes((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleExpandAll() {
    if (allExpanded) {
      setOpenIndexes(new Set());
      return;
    }
    setOpenIndexes(new Set(visibleItems.map((_, index) => index)));
  }

  return (
    <TourSection
      id="important"
      title="Важно знать"
      headerAddon={
        totalCount > 1 ? (
          <TourSectionExpandToggle
            allExpanded={allExpanded}
            openCount={openCount}
            totalCount={totalCount}
            openSegments={openSegments}
            onToggle={handleExpandAll}
            groupAriaLabel={
              allExpanded ? "Свернуть все блоки раздела" : "Раскрыть все блоки раздела"
            }
            segmentsTitle={`Открыто ${openCount} из ${totalCount}`}
            statusLabel={formatImportantExpandStatus(openCount, totalCount, allExpanded)}
          />
        ) : undefined
      }
    >
      <div className="space-y-4">
        {visibleItems.map((item, index) => {
          const isOpen = openIndexes.has(index);
          return (
            <div
              key={`${item.title}-${index}`}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card sm:p-6"
            >
              <button
                type="button"
                onClick={() => toggleIndex(index)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <span className="font-heading text-base font-semibold text-charcoal sm:text-lg">
                  {item.title}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-slate transition-transform",
                    isOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
              {isOpen ? (
                <div
                  className="rich-text-editor-content mt-4 text-sm leading-relaxed text-slate [&_li]:mt-1 [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: item.html }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </TourSection>
  );
}
