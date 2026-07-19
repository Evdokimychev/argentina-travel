import { CalendarDays, Clock, ExternalLink, MapPin, Ticket } from "lucide-react";
import type { PlaceDetail } from "@/types/place";
import { cn } from "@/lib/cn";

export default function PlacePracticalSummary({
  place,
  className,
}: {
  place: Pick<
    PlaceDetail,
    "region" | "province" | "visitDuration" | "season" | "ticketPrice" | "website"
  >;
  className?: string;
}) {
  return (
    <section
      id="place-planning"
      className={cn(
        "scroll-mt-28 rounded-card border border-border-subtle bg-surface-elevated p-5 shadow-card",
        className,
      )}
      aria-labelledby="place-planning-title"
    >
      <h2 id="place-planning-title" className="font-heading text-lg font-bold text-charcoal">
        План поездки
      </h2>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-1">
        <div className="flex gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
          <div>
            <dt className="text-slate">Регион</dt>
            <dd className="font-medium text-charcoal">{place.region}</dd>
            {place.province ? <dd className="text-slate">{place.province}</dd> : null}
          </div>
        </div>
        <div className="flex gap-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
          <div>
            <dt className="text-slate">Сколько времени</dt>
            <dd className="font-medium text-charcoal">{place.visitDuration}</dd>
          </div>
        </div>
        <div className="flex gap-3">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
          <div>
            <dt className="text-slate">Когда ехать</dt>
            <dd className="font-medium text-charcoal">{place.season}</dd>
          </div>
        </div>
        {place.ticketPrice ? (
          <div className="flex gap-3">
            <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
            <div>
              <dt className="text-slate">Стоимость</dt>
              <dd className="font-medium text-charcoal">{place.ticketPrice}</dd>
            </div>
          </div>
        ) : null}
      </dl>

      {place.website ? (
        <a
          href={place.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-sky-ink hover:underline"
        >
          Проверить на официальном сайте
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      ) : null}
    </section>
  );
}
