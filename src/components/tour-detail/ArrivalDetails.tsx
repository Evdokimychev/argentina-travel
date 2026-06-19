import {
  ArrowLeft,
  ArrowRight,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
} from "lucide-react";
import type { ReactNode } from "react";
import type { TourArrivalInfo } from "@/types";
import type { TourLogistics } from "@/types/tour";
import type { OrganizerArrivalDepartureCity } from "@/data/tour-logistics-defaults";
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
          isEmpty ? "text-slate/70" : "text-gray-700"
        )}
      >
        {children}
      </div>
    </div>
  );
}

function ScheduleColumn({
  city,
  dayLabel,
  timeLabel,
  icon,
  title,
}: {
  city: string;
  dayLabel: string;
  timeLabel?: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-bold text-charcoal">{title}</p>
      </div>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[15px] leading-snug text-charcoal">{city}</p>
          <p className="mt-1 text-xs font-medium text-emerald-600">{dayLabel}</p>
        </div>
        {timeLabel ? <p className="shrink-0 pt-0.5 text-sm text-slate">{timeLabel}</p> : null}
      </div>
    </div>
  );
}

function CityArrivalDepartureBlock({ city }: { city: OrganizerArrivalDepartureCity }) {
  const showPlane =
    city.plane.enabled && (city.canArrive || city.canDepart);
  const showOther =
    (city.trainEnabled || city.otherEnabled) && (city.canArrive || city.canDepart);
  const dayLabels = {
    arrival: getTransportDayShortLabel(city.plane.arrivalDay),
    departure: getTransportDayShortLabel(city.plane.departureDay),
  };

  return (
    <article className="space-y-5">
      {showPlane ? (
        <div>
          <p className="text-sm font-bold text-charcoal">На самолёте</p>
          <div className="mt-4 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {city.canArrive ? (
              <ScheduleColumn
                city={city.city}
                dayLabel={dayLabels.arrival}
                timeLabel={formatLatestArrivalTime(city.plane.latestArrivalTime)}
                title="Прибытие"
                icon={<PlaneLanding className="h-4 w-4 text-charcoal" strokeWidth={2.25} />}
              />
            ) : null}
            {city.canDepart ? (
              <ScheduleColumn
                city={city.city}
                dayLabel={dayLabels.departure}
                timeLabel={formatEarliestDepartureTime(city.plane.earliestDepartureTime)}
                title="Выезд"
                icon={<PlaneTakeoff className="h-4 w-4 text-charcoal" strokeWidth={2.25} />}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {showOther ? (
        <div>
          <p className="text-sm font-bold text-charcoal">На другом транспорте</p>
          <div className="mt-4 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {city.canArrive ? (
              <ScheduleColumn
                city={city.city}
                dayLabel={dayLabels.arrival}
                title="Прибытие"
                icon={<ArrowRight className="h-4 w-4 text-charcoal" strokeWidth={2.25} />}
              />
            ) : null}
            {city.canDepart ? (
              <ScheduleColumn
                city={city.city}
                dayLabel={dayLabels.departure}
                title="Выезд"
                icon={<ArrowLeft className="h-4 w-4 text-charcoal" strokeWidth={2.25} />}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {city.comment.trim() ? (
        <div className="rounded-2xl bg-pampas/70 px-5 py-4">
          <p className="text-sm font-bold text-charcoal">Комментарий организатора</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-charcoal">
            {city.comment.trim()}
          </p>
        </div>
      ) : null}
    </article>
  );
}

export function getArrivalScheduleCities(logistics?: TourLogistics) {
  if (!logistics?.arrivalDepartureEnabled) return [];

  return logistics.arrivalDepartureCities.filter((city) => {
    if (!city.city.trim()) return false;

    const hasPlane = city.plane.enabled && (city.canArrive || city.canDepart);
    const hasOther =
      (city.trainEnabled || city.otherEnabled) && (city.canArrive || city.canDepart);

    return hasPlane || hasOther || city.comment.trim().length > 0;
  });
}

export default function ArrivalDetails({
  arrival,
  logistics,
}: {
  arrival: TourArrivalInfo;
  logistics?: TourLogistics;
}) {
  const scheduleCities = getArrivalScheduleCities(logistics);
  const hasSchedule = scheduleCities.length > 0;

  const hasAirports = arrival.airports.length > 0;
  const hasFlights = arrival.flights.length > 0;
  const hasTransfers = arrival.transfers.length > 0;
  const hasMeetingPoint = Boolean(arrival.meetingPoint.trim());
  const hasPracticalInfo = hasAirports || hasFlights || hasTransfers || hasMeetingPoint;

  return (
    <div className="rounded-2xl border border-sky-200/70 bg-sky-50/50 p-6">
      <div className="space-y-7">
        {hasSchedule ? (
          <div className="space-y-7">
            {scheduleCities.map((city) => (
              <CityArrivalDepartureBlock key={city.id} city={city} />
            ))}
          </div>
        ) : null}

        {hasSchedule && hasPracticalInfo ? (
          <div className="border-t border-sky-200/70 pt-7" aria-hidden />
        ) : null}

        {hasPracticalInfo ? (
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
        ) : null}
      </div>
    </div>
  );
}
