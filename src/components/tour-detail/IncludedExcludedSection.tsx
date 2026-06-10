import { hasTermsListContent } from "@/lib/tour-public-display";
import TourSection from "./TourSection";

export default function IncludedExcludedSection({
  included,
  excluded,
}: {
  included: string[];
  excluded: string[];
}) {
  const includedItems = included.filter((item) => item.trim());
  const excludedItems = excluded.filter((item) => item.trim());

  if (!hasTermsListContent(includedItems) && !hasTermsListContent(excludedItems)) {
    return null;
  }

  return (
    <TourSection id="included" title="Условия тура" subtitle="Что включено и не включено в стоимость">
      <div className="grid gap-4 sm:grid-cols-2">
        {hasTermsListContent(includedItems) ? (
          <div className="rounded-2xl border border-success/20 bg-success-muted p-5 sm:p-6">
            <h3 className="font-display text-lg font-bold text-charcoal">Что включено</h3>
            <ul className="mt-4 space-y-3">
              {includedItems.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-charcoal">
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-success"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {hasTermsListContent(excludedItems) ? (
          <div className="rounded-2xl border border-gray-100 bg-surface-muted/40 p-5 sm:p-6">
            <h3 className="font-display text-lg font-bold text-charcoal">Что не включено</h3>
            <ul className="mt-4 space-y-3">
              {excludedItems.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate">
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </TourSection>
  );
}
