"use client";

import { cn } from "@/lib/cn";
import { ORGANIZER_TICKET_RECOMMENDATIONS_MAX } from "@/data/tour-logistics-defaults";

interface TourTicketRecommendationsBlockProps {
  enabled: boolean;
  text: string;
  onEnabledChange: (enabled: boolean) => void;
  onChange: (text: string) => void;
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 text-left"
    >
      <span
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 overflow-hidden rounded-full p-0.5 transition-colors duration-200",
          checked ? "bg-brand" : "bg-gray-300"
        )}
      >
        <span
          className={cn(
            "block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-charcoal">{label}</span>
        {description ? (
          <span className="mt-1 block text-sm leading-relaxed text-slate">{description}</span>
        ) : null}
      </span>
    </button>
  );
}

export default function TourTicketRecommendationsBlock({
  enabled,
  text,
  onEnabledChange,
  onChange,
}: TourTicketRecommendationsBlockProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <ToggleSwitch
        checked={enabled}
        onChange={onEnabledChange}
        label="Рекомендации для покупки билетов"
        description="Появятся в блоке «Рекомендуемые рейсы» на странице тура. Каждый пункт можно указать с новой строки."
      />

      {enabled ? (
        <div className="space-y-1.5 border-t border-gray-200/80 pt-4">
          <label htmlFor="ticket-recommendations-text" className="text-xs font-medium text-charcoal">
            Обобщённый комментарий для туриста (необязательно)
          </label>
          <textarea
            id="ticket-recommendations-text"
            value={text}
            maxLength={ORGANIZER_TICKET_RECOMMENDATIONS_MAX}
            rows={5}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Например: рекомендуем покупать билеты с возможностью возврата и прибывать за день до начала тура."
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-charcoal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <p className="text-right text-xs text-slate">
            {text.length} / {ORGANIZER_TICKET_RECOMMENDATIONS_MAX}
          </p>
        </div>
      ) : null}
    </section>
  );
}
