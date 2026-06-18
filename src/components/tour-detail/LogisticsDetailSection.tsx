import { Plane, Train, Bus } from "lucide-react";
import type { Tour } from "@/types/tour";
import {
  formatArrivalDepartureCity,
  hasTicketRecommendations,
} from "@/lib/tour-public-display";
import TourSection from "./TourSection";

interface LogisticsDetailSectionProps {
  tour: Tour;
  organizerComment?: string;
}

export default function LogisticsDetailSection({
  tour,
  organizerComment,
}: LogisticsDetailSectionProps) {
  const showTickets =
    hasTicketRecommendations(tour) && !tour.logistics.arrivalDetailsEnabled;

  const showUnifiedArrivalPanel =
    tour.logistics.arrivalDetailsEnabled && tour.logistics.arrivalDepartureEnabled;

  const nonPlaneCities = tour.logistics.arrivalDepartureCities
    .filter((city) => city.city.trim() && (city.trainEnabled || city.otherEnabled))
    .map(formatArrivalDepartureCity);

  if (!showTickets && (showUnifiedArrivalPanel || nonPlaneCities.length === 0)) return null;

  return (
    <TourSection id="logistics" title="Логистика и перелёт" organizerComment={organizerComment}>
      {showTickets && !tour.logistics.arrivalDetailsEnabled ? (
        <div>
          <h3 className="font-heading text-lg font-bold text-charcoal">Рекомендации по перелёту</h3>
          <p className="mt-1 text-sm text-slate">Как лучше спланировать дорогу до начала тура</p>
          <div className="mt-4 rounded-2xl border border-gray-100 bg-surface-muted/40 p-6">
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate">
              {tour.logistics.ticketRecommendationsText.trim()}
            </p>
          </div>
        </div>
      ) : null}

      {nonPlaneCities.length > 0 && !showUnifiedArrivalPanel ? (
        <div className={showTickets ? "mt-8" : undefined}>
          <h3 className="font-heading text-lg font-bold text-charcoal">Другие способы добраться</h3>
          <p className="mt-1 text-sm text-slate">Поезд и альтернативный транспорт</p>
          <div className="mt-4 space-y-4">
            {nonPlaneCities.map((city) => (
              <article
                key={city.title}
                className="rounded-2xl border border-gray-100 bg-surface-muted/30 p-6"
              >
                <h4 className="font-heading text-base font-bold text-charcoal">{city.title}</h4>

                {city.transport.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {city.transport.map((mode) => (
                      <span
                        key={mode}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-charcoal"
                      >
                        {mode === "Самолёт" ? (
                          <Plane className="h-3.5 w-3.5 text-sky" />
                        ) : mode === "Поезд" ? (
                          <Train className="h-3.5 w-3.5 text-sky" />
                        ) : (
                          <Bus className="h-3.5 w-3.5 text-sky" />
                        )}
                        {mode}
                      </span>
                    ))}
                  </div>
                ) : null}

                {city.comment ? (
                  <p className="mt-3 rounded-xl bg-white px-4 py-3 text-sm leading-relaxed text-charcoal">
                    {city.comment}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </TourSection>
  );
}
