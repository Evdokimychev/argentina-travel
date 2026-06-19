"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { TourAccommodation, type ComfortLevel } from "@/types";
import { normalizeEditorValue } from "@/lib/rich-text";
import FormattedPrice from "@/components/FormattedPrice";
import { formatNights } from "@/lib/pluralize";
import AccommodationsComfortFooter from "./AccommodationsComfortFooter";
import TourSection from "./TourSection";
import { tourDetailCardBorderClass, tourDetailInsetMutedClass } from "@/lib/tour-detail-ui";
import { cn } from "@/lib/cn";

function AccommodationBadges({ acc }: { acc: TourAccommodation }) {
  return (
    <div className="flex flex-wrap gap-2">
      {acc.accommodationType ? (
        <span className="rounded-full bg-sky/10 px-3 py-1 text-xs font-medium text-sky">
          {acc.accommodationType}
        </span>
      ) : null}
      {acc.nights ? (
        <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-slate">
          {acc.fullPeriod ? "Весь период" : formatNights(acc.nights)}
        </span>
      ) : null}
      {acc.displayMode === "booking_link" ? (
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
          Booking.com
        </span>
      ) : null}
      <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
        {acc.comfort}
      </span>
    </div>
  );
}

function AccommodationCard({ acc }: { acc: TourAccommodation }) {
  const image = acc.images[0];

  return (
    <article className={cn(tourDetailCardBorderClass, "overflow-hidden")}>
      <div className="grid md:grid-cols-2">
        {image ? (
          <div className="relative h-48 md:h-auto md:min-h-[220px]">
            <Image
              src={image}
              alt={acc.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ) : null}
        <div className="p-5 sm:p-6">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-charcoal">{acc.name}</h3>
              <div className="mt-2">
                <AccommodationBadges acc={acc} />
              </div>
            </div>

            {acc.description ? (
              <div
                className="prose prose-sm max-w-none text-slate prose-p:my-2"
                dangerouslySetInnerHTML={{ __html: normalizeEditorValue(acc.description) }}
              />
            ) : null}

            {acc.amenities.length ? (
              <div className="flex flex-wrap gap-2">
                {acc.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-lg bg-surface-muted px-2.5 py-1 text-xs text-slate"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            ) : null}

            {acc.displayMode === "booking_link" && acc.bookingUrl ? (
              <a
                href={acc.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
              >
                {acc.bookingLabel ?? "Посмотреть на Booking.com"}
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            ) : null}

            {acc.roomTypes?.length ? (
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate">
                  Типы номеров
                </p>
                <ul className="space-y-2">
                  {acc.roomTypes.map((room) => (
                    <li
                      key={room.id}
                      className={cn(tourDetailInsetMutedClass, "px-3 py-2.5")}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-charcoal">{room.name}</p>
                          {room.description ? (
                            <p className="mt-0.5 text-xs text-slate">{room.description}</p>
                          ) : null}
                          <p className="mt-1 text-[11px] text-slate">
                            До {room.capacity} чел. в номере
                          </p>
                        </div>
                        {room.priceUsdPerPerson === 0 ? (
                          <span className="shrink-0 text-xs font-semibold text-sky-dark">
                            Включено
                          </span>
                        ) : (
                          <span className="shrink-0 text-xs font-semibold text-charcoal">
                            +{" "}
                            <FormattedPrice
                              priceUsd={room.priceUsdPerPerson}
                              className="inline text-xs font-semibold"
                            />{" "}
                            / чел.
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {acc.alternatives?.length ? (
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate">
                  Альтернативы
                </p>
                <ul className="space-y-2">
                  {acc.alternatives.map((alt) => (
                    <li key={alt.id} className="rounded-xl border border-dashed border-gray-200 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-charcoal">{alt.name}</p>
                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-slate">
                          {alt.accommodationType}
                        </span>
                      </div>
                      {alt.description ? (
                        <p className="mt-1 text-xs text-slate">{alt.description}</p>
                      ) : null}
                      {alt.displayMode === "booking_link" && alt.bookingUrl ? (
                        <a
                          href={alt.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                        >
                          {alt.bookingLabel ?? "Booking.com"}
                          <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AccommodationsSection({
  accommodations,
  durationNights,
  comfortLevel,
  comfortLevels,
  comfortDescriptionHtml,
  organizerComment,
}: {
  accommodations: TourAccommodation[];
  durationNights: number;
  comfortLevel: ComfortLevel;
  comfortLevels?: ComfortLevel[];
  comfortDescriptionHtml?: string;
  organizerComment?: string;
}) {
  const showComfortFooter = Boolean(
    comfortLevel || comfortDescriptionHtml?.trim()
  );

  return (
    <TourSection
      id="accommodations"
      title="Проживание"
      organizerComment={organizerComment}
      subtitle={
        durationNights > 0 ? (
          <>
            Варианты размещения по маршруту · всего{" "}
            <span className="font-medium text-charcoal">{formatNights(durationNights)}</span> в туре
          </>
        ) : (
          "Варианты размещения по маршруту"
        )
      }
    >
      <div className="space-y-6">
        {accommodations.map((acc) => (
          <AccommodationCard key={acc.id} acc={acc} />
        ))}
      </div>

      {showComfortFooter ? (
        <AccommodationsComfortFooter
          comfortLevel={comfortLevel}
          comfortLevels={comfortLevels}
          comfortDescriptionHtml={comfortDescriptionHtml}
        />
      ) : null}
    </TourSection>
  );
}
