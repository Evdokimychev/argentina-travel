import { SectionHeading } from "./InfoModal";

export default function IncludedExcludedSection({
  included,
  excluded,
}: {
  included: string[];
  excluded: string[];
}) {
  return (
    <section id="included" className="scroll-mt-32 grid gap-4 sm:grid-cols-2">
      <div>
        <SectionHeading title="Что включено" />
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 sm:p-6">
          <ul className="space-y-3">
            {included.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-charcoal">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <SectionHeading title="Что не включено" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <ul className="space-y-3">
            {excluded.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-slate">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
