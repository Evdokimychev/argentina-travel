"use client";

import { Check, X } from "lucide-react";
import TourSection from "@/components/tour-detail/TourSection";
import { isHtmlContent, sanitizeHtml } from "@/lib/rich-text";

function TermsContent({ text }: { text: string }) {
  if (isHtmlContent(text)) {
    return (
      <div
        className="rich-text-editor-content mt-2 text-sm leading-relaxed text-charcoal/90"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
      />
    );
  }

  return <p className="mt-2 text-sm leading-relaxed text-charcoal/90">{text}</p>;
}

export default function ExcursionIncludedSection({
  included,
  excluded,
  title,
  includedLabel,
  excludedLabel,
}: {
  included?: string;
  excluded?: string;
  title: string;
  includedLabel: string;
  excludedLabel: string;
}) {
  if (!included && !excluded) return null;

  return (
    <TourSection id="included" title={title}>
      <div className="grid gap-4 sm:grid-cols-2">
        {included ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <Check className="h-4 w-4" aria-hidden />
              {includedLabel}
            </p>
            <TermsContent text={included} />
          </div>
        ) : null}
        {excluded ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-rose-800">
              <X className="h-4 w-4" aria-hidden />
              {excludedLabel}
            </p>
            <TermsContent text={excluded} />
          </div>
        ) : null}
      </div>
    </TourSection>
  );
}
