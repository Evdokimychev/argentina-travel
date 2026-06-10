"use client";

import { useState } from "react";
import HubSection from "@/components/guide/hub/HubSection";
import type { GuidePillarFaqItem } from "@/types/guide-pillar";

type GuidePillarFaqProps = {
  items: GuidePillarFaqItem[];
  intro?: string;
};

export default function GuidePillarFaq({ items, intro }: GuidePillarFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!items.length) return null;

  return (
    <HubSection
      id="faq"
      title="Часто задаваемые вопросы"
      subtitle={
        intro ??
        "Ответы для туристов и тех, кто планирует переезд. Информация справочная — уточняйте актуальность перед поездкой."
      }
      className="[&>header]:mb-5"
    >
      <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-surface-muted/30">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50"
                aria-expanded={isOpen}
              >
                <span className="font-medium text-charcoal">{item.question}</span>
                <svg
                  className={`h-5 w-5 shrink-0 text-slate transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isOpen ? (
                <p className="px-5 pb-4 text-sm leading-relaxed text-slate">{item.answer}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </HubSection>
  );
}
