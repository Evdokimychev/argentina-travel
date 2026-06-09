"use client";

import { useState } from "react";
import Image from "next/image";
import { RichTextBlock, TourDescriptionExtra } from "@/types";
import {
  DESCRIPTION_EXTRA_TABS,
  type DescriptionExtraTabId,
} from "@/data/tour-description-extra";
import { SectionHeading } from "./InfoModal";
import { cn } from "@/lib/cn";

interface DescriptionSectionProps {
  blocks: RichTextBlock[];
  extra: TourDescriptionExtra;
}

function ExtraTabContent({
  tabId,
  extra,
}: {
  tabId: DescriptionExtraTabId;
  extra: TourDescriptionExtra;
}) {
  switch (tabId) {
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

export default function DescriptionSection({ blocks, extra }: DescriptionSectionProps) {
  const [activeTab, setActiveTab] = useState<DescriptionExtraTabId>("seasonality");

  return (
    <section id="description" className="tour-section-target">
      <SectionHeading title="Описание путешествия" />
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="space-y-5 p-6 sm:p-8">
          {blocks.map((block, i) => {
            switch (block.type) {
              case "heading":
                return (
                  <h3 key={i} className="font-display text-xl font-bold text-charcoal">
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

        <div className="border-t border-gray-100 bg-pampas/40">
          <div
            className="scrollbar-hide flex gap-1 overflow-x-auto border-b border-gray-100 px-4 pt-3 sm:px-6"
            role="tablist"
            aria-label="Дополнительная информация о туре"
          >
            {DESCRIPTION_EXTRA_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "shrink-0 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-white text-charcoal shadow-sm"
                    : "text-slate hover:text-charcoal"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-6 sm:p-8" role="tabpanel">
            <ExtraTabContent tabId={activeTab} extra={extra} />
          </div>
        </div>
      </div>
    </section>
  );
}
