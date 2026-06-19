"use client";

import { useState } from "react";
import TourSection from "./TourSection";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";

export default function PartnerTourOrgDetailsSection({
  content,
}: {
  content: PartnerTourContent;
}) {
  const intro = content.orgDetailsIntroHtml?.trim();
  const items = content.orgDetailsItems ?? [];
  const extra = content.orgDetailsExtraHtml?.trim();
  const [openIndex, setOpenIndex] = useState<number | null>(items.length ? 0 : null);

  if (!intro && !items.length && !extra) return null;

  return (
    <TourSection id="org-details" title="Организационные детали">
      {intro ? (
        <div
          className="rich-text-editor-content space-y-4 leading-relaxed text-charcoal/90"
          dangerouslySetInnerHTML={{ __html: intro }}
        />
      ) : null}

      {items.length ? (
        <div
          className={
            intro
              ? "mt-5 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-surface-muted/30"
              : "divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-surface-muted/30"
          }
        >
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={`${item.title}-${index}`}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50"
                >
                  <span className="font-medium text-charcoal">{item.title}</span>
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
                  <div
                    className="rich-text-editor-content px-5 pb-4 text-sm leading-relaxed text-slate"
                    dangerouslySetInnerHTML={{ __html: item.html }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {extra ? (
        <div
          className={
            intro || items.length
              ? "rich-text-editor-content mt-5 space-y-4 leading-relaxed text-charcoal/90"
              : "rich-text-editor-content space-y-4 leading-relaxed text-charcoal/90"
          }
          dangerouslySetInnerHTML={{ __html: extra }}
        />
      ) : null}
    </TourSection>
  );
}
