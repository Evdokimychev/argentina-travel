"use client";

import { useState } from "react";
import { TourFAQ } from "@/types";
import { normalizeEditorValue } from "@/lib/rich-text";
import TourSection from "./TourSection";

export default function FAQSection({
  faq,
  organizerComment,
}: {
  faq: TourFAQ[];
  organizerComment?: string;
}) {
  const items = faq.filter((item) => item.question?.trim() && item.answer?.trim());
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  if (!items.length) return null;

  return (
    <TourSection id="faq" title="Часто задаваемые вопросы" organizerComment={organizerComment}>
      <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-surface-muted/30">
        {items.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50"
              >
                <span className="font-medium text-charcoal">{item.question}</span>
                <svg
                  className={`h-5 w-5 shrink-0 text-slate transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div
                  className="rich-text-editor-content px-5 pb-4 text-sm leading-relaxed text-slate"
                  dangerouslySetInnerHTML={{ __html: normalizeEditorValue(item.answer) }}
                />
              )}
            </div>
          );
        })}
      </div>
    </TourSection>
  );
}
