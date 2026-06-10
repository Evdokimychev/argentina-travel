import { Plane, Train, Bus } from "lucide-react";
import type { Tour } from "@/types/tour";
import {
  formatArrivalDepartureCity,
  hasArrivalDepartureLogistics,
  hasTicketRecommendations,
} from "@/lib/tour-public-display";
import { SectionHeading } from "./InfoModal";

interface LogisticsDetailSectionProps {
  tour: Tour;
}

export default function LogisticsDetailSection({ tour }: LogisticsDetailSectionProps) {
  const showTickets = hasTicketRecommendations(tour);
  const showCities = hasArrivalDepartureLogistics(tour);

  if (!showTickets && !showCities) return null;

  const cities = tour.logistics.arrivalDepartureCities
    .filter((city) => city.city.trim())
    .map(formatArrivalDepartureCity);

  return (
    <section id="logistics" className="tour-section-target space-y-8">
      {showTickets ? (
        <div>
          <SectionHeading
            title="Рекомендации по перелёту"
            subtitle="Как лучше спланировать дорогу до начала тура"
          />
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate">
              {tour.logistics.ticketRecommendationsText.trim()}
            </p>
          </div>
        </div>
      ) : null}

      {showCities ? (
        <div>
          <SectionHeading
            title="Прибытие и отъезд"
            subtitle="Города, транспорт и рекомендуемое время"
          />
          <div className="space-y-4">
            {cities.map((city) => (
              <article
                key={city.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <h3 className="font-display text-lg font-bold text-charcoal">{city.title}</h3>

                {city.transport.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {city.transport.map((mode) => (
                      <span
                        key={mode}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-charcoal"
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

                {city.schedule ? (
                  <p className="mt-3 text-sm leading-relaxed text-slate">{city.schedule}</p>
                ) : null}

                {city.comment ? (
                  <p className="mt-3 rounded-xl bg-pampas/60 px-4 py-3 text-sm leading-relaxed text-charcoal">
                    {city.comment}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
