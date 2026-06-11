import { Plane, PlaneLanding, PlaneTakeoff } from "lucide-react";
import type { ReactNode } from "react";
import type { TourArrivalInfo } from "@/types";
import type { TourLogistics } from "@/types/tour";
import {
  formatEarliestDepartureTime,
  formatLatestArrivalTime,
  getTransportDayShortLabel,
} from "@/data/tour-logistics-defaults";
import { cn } from "@/lib/cn";

function EmptyValue() {
  return <>Не указано</>;
}

function DetailCell({
  title,
  isEmpty,
  children,
}: {
  title: string;
  isEmpty?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <h4 className="text-sm font-bold leading-snug text-charcoal">{title}</h4>
      <div
        className={cn(
          "mt-1.5 text-sm leading-relaxed",
          isEmpty ? "text-gray-400" : "text-gray-700"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default function ArrivalDetails({ arrival }: { arrival: TourArrivalInfo }) {
  const hasAirports = arrival.airports.length > 0;
  const hasFlights = arrival.flights.length > 0;
  const hasTransfers = arrival.transfers.length > 0;
  const hasMeetingPoint = Boolean(arrival.meetingPoint.trim());

  return (
    <div className="rounded-2xl border border-sky-200/70 bg-sky-50/50 p-6">
      <div className="grid grid-cols-1 gap-x-12 gap-y-7 sm:grid-cols-2">
        <DetailCell title="Аэропорты" isEmpty={!hasAirports}>
          {hasAirports ? (
            <ul className="space-y-1">
              {arrival.airports.map((airport) => (
                <li key={airport} className="flex items-start gap-2">
                  <Plane className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky" strokeWidth={2} />
                  <span>{airport}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyValue />
          )}
        </DetailCell>

        <DetailCell title="Рекомендуемые рейсы" isEmpty={!hasFlights}>
          {hasFlights ? (
            <ul className="space-y-1">
              {arrival.flights.map((flight) => (
                <li key={flight} className="whitespace-pre-line">
                  {flight}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyValue />
          )}
        </DetailCell>

        <DetailCell title="Трансферы" isEmpty={!hasTransfers}>
          {hasTransfers ? (
            <ul className="space-y-1">
              {arrival.transfers.map((transfer) => (
                <li key={transfer}>{transfer}</li>
              ))}
            </ul>
          ) : (
            <EmptyValue />
          )}
        </DetailCell>

        <DetailCell title="Место встречи" isEmpty={!hasMeetingPoint}>
          {hasMeetingPoint ? arrival.meetingPoint : <EmptyValue />}
        </DetailCell>
      </div>
    </div>
  );
}

function PlaneScheduleColumn({
  kind,
  city,
  dayLabel,
  timeLabel,
}: {
  kind: "arrival" | "departure";
  city: string;
  dayLabel: string;
  timeLabel: string;
}) {
  const Icon = kind === "arrival" ? PlaneLanding : PlaneTakeoff;
  const title = kind === "arrival" ? "Прибытие" : "Выезд";

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-charcoal" strokeWidth={2.25} />
        <p className="text-sm font-bold text-charcoal">{title}</p>
      </div>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[15px] leading-snug text-charcoal">{city}</p>
          <p className="mt-1 text-xs font-medium text-emerald-600">{dayLabel}</p>
        </div>
        <p className="shrink-0 pt-0.5 text-sm text-slate">{timeLabel}</p>
      </div>
    </div>
  );
}

export function ArrivalRecommendations({ logistics }: { logistics: TourLogistics }) {
  const planeCities = logistics.arrivalDepartureCities.filter(
    (city) => city.city.trim() && city.plane.enabled && (city.canArrive || city.canDepart)
  );

  if (!logistics.arrivalDepartureEnabled || planeCities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      {planeCities.map((city) => (
        <article key={city.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h4 className="font-heading text-lg font-bold text-charcoal">Рекомендации по прибытию</h4>

          <div className="mt-4">
            <p className="text-sm font-bold text-charcoal">На самолёте</p>

            <div className="mt-4 grid grid-cols-1 gap-8 sm:grid-cols-2">
              {city.canArrive ? (
                <PlaneScheduleColumn
                  kind="arrival"
                  city={city.city}
                  dayLabel={getTransportDayShortLabel(city.plane.arrivalDay)}
                  timeLabel={formatLatestArrivalTime(city.plane.latestArrivalTime)}
                />
              ) : null}

              {city.canDepart ? (
                <PlaneScheduleColumn
                  kind="departure"
                  city={city.city}
                  dayLabel={getTransportDayShortLabel(city.plane.departureDay)}
                  timeLabel={formatEarliestDepartureTime(city.plane.earliestDepartureTime)}
                />
              ) : null}
            </div>
          </div>

          {city.comment.trim() ? (
            <p className="mt-5 rounded-xl bg-pampas/70 px-4 py-3 text-sm leading-relaxed text-charcoal">
              {city.comment.trim()}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
