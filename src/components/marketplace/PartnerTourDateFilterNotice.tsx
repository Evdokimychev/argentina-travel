import { Info } from "lucide-react";

/** Shown when date filters are active but partner (Tripster) tours ignore them in the catalog. */
export default function PartnerTourDateFilterNotice() {
  return (
    <div
      className="mb-4 flex gap-3 rounded-2xl border border-sky/15 bg-sky/[0.06] px-4 py-3 text-sm leading-relaxed text-charcoal"
      role="status"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
      <p>
        Туры партнёра Tripster в списке не фильтруются по датам — актуальное расписание и цены
        смотрите на странице тура или при бронировании на Tripster.
      </p>
    </div>
  );
}
