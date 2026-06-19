"use client";

import { SwitchField } from "@/components/ui/switch";
import { ORGANIZER_TICKET_RECOMMENDATIONS_MAX } from "@/data/tour-logistics-defaults";

interface TourTicketRecommendationsBlockProps {
  enabled: boolean;
  text: string;
  onEnabledChange: (enabled: boolean) => void;
  onChange: (text: string) => void;
}

export default function TourTicketRecommendationsBlock({
  enabled,
  text,
  onEnabledChange,
  onChange,
}: TourTicketRecommendationsBlockProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <SwitchField
        checked={enabled}
        onCheckedChange={onEnabledChange}
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
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-charcoal outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
          />
          <p className="text-right text-xs text-slate">
            {text.length} / {ORGANIZER_TICKET_RECOMMENDATIONS_MAX}
          </p>
        </div>
      ) : null}
    </section>
  );
}
