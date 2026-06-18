"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { RichTextBlock, TourDescriptionExtra } from "@/types";
import { normalizeEditorValue } from "@/lib/rich-text";
import {
  DESCRIPTION_EXTRA_TABS,
  type DescriptionExtraTabId,
} from "@/data/tour-description-extra";
import TourSection from "./TourSection";
import { cn } from "@/lib/cn";

interface DescriptionSectionProps {
  blocks: RichTextBlock[];
  extra: TourDescriptionExtra;
}

function tabHasContent(tabId: DescriptionExtraTabId, extra: TourDescriptionExtra): boolean {
  switch (tabId) {
    case "difficulty":
      return extra.difficulty.trim().length > 0;
    case "seasonality":
      return extra.seasonality.trim().length > 0;
    case "packing":
      return extra.packing.length > 0;
    case "flights":
      return extra.flights.trim().length > 0;
    case "meals":
      return extra.meals.trim().length > 0;
    case "comfort":
      return extra.comfort.trim().length > 0;
    case "transfers":
      return extra.transfers.trim().length > 0;
    default:
      return false;
  }
}

function ExtraTabContent({
  tabId,
  extra,
}: {
  tabId: DescriptionExtraTabId;
  extra: TourDescriptionExtra;
}) {
  switch (tabId) {
    case "difficulty":
      return (
        <div
          className="rich-text-editor-content text-sm leading-relaxed text-slate"
          dangerouslySetInnerHTML={{ __html: normalizeEditorValue(extra.difficulty) }}
        />
      );
    case "seasonality":
      return <p className="leading-relaxed text-slate">{extra.seasonality}</p>;
    case "packing":
      return (
        <ul className="space-y-2 text-slate">
          {extra.packing.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-relaxed">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      );
    case "flights":
      return <p className="leading-relaxed text-slate">{extra.flights}</p>;
    case "meals":
      return <p className="leading-relaxed text-slate">{extra.meals}</p>;
    case "comfort":
      return <p className="leading-relaxed text-slate">{extra.comfort}</p>;
    case "transfers":
      return <p className="leading-relaxed text-slate">{extra.transfers}</p>;
    default:
      return null;
  }
}

export default function DescriptionSection({
  blocks,
  extra,
  organizerComment,
}: DescriptionSectionProps & { organizerComment?: string }) {
  const visibleTabs = useMemo(
    () => DESCRIPTION_EXTRA_TABS.filter((tab) => tabHasContent(tab.id, extra)),
    [extra]
  );
  const [activeTab, setActiveTab] = useState<DescriptionExtraTabId>(
    visibleTabs[0]?.id ?? "difficulty"
  );

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id ?? "difficulty");
    }
  }, [activeTab, visibleTabs]);

  return (
    <TourSection id="description" title="Описание путешествия" organizerComment={organizerComment}>
      <div className="space-y-5">
          {blocks.map((block, i) => {
            switch (block.type) {
              case "heading":
                return (
                  <h3 key={i} className="font-heading text-xl font-bold text-charcoal">
                    {block.content}
                  </h3>
                );
              case "paragraph":
                return (
                  <p key={i} className="leading-relaxed text-slate">
                    {block.content}
                  </p>
                );
              case "list":
                return (
                  <ul key={i} className="list-inside list-disc space-y-2 text-slate">
                    {block.items?.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                );
              case "quote":
                return (
                  <blockquote
                    key={i}
                    className="border-l-4 border-sky pl-4 italic text-charcoal"
                  >
                    {block.content}
                  </blockquote>
                );
              case "image":
                return (
                  <figure key={i} className="overflow-hidden rounded-xl">
                    <div className="relative aspect-[16/9]">
                      <Image
                        src={block.image!}
                        alt={block.caption ?? ""}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 700px"
                      />
                    </div>
                    {block.caption && (
                      <figcaption className="mt-2 text-center text-sm text-slate">
                        {block.caption}
                      </figcaption>
                    )}
                  </figure>
                );
              default:
                return null;
            }
          })}
      </div>

      {visibleTabs.length > 0 ? (
        <div className="-mx-2 mt-8 border-t border-gray-100 pt-6 sm:-mx-4">
          <div
            className="scrollbar-hide flex gap-1.5 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Дополнительная информация о туре"
          >
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-sky bg-sky text-white shadow-sm"
                    : "border-gray-200 bg-white text-foreground/80 hover:border-sky/30 hover:bg-sky/5 hover:text-sky"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="pt-5" role="tabpanel">
            <ExtraTabContent tabId={activeTab} extra={extra} />
          </div>
        </div>
      ) : null}
    </TourSection>
  );
}
