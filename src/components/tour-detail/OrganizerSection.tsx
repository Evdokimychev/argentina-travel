import Image from "next/image";
import Link from "next/link";
import { TourDetail, TourOrganizerDetail } from "@/types";
import { SectionHeading } from "./InfoModal";
import { formatYears, formatTours } from "@/lib/pluralize";

function OrganizerStats({ organizer }: { organizer: TourOrganizerDetail }) {
  return (
    <>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate">
        <span className="flex items-center gap-1 font-medium text-charcoal">
          <svg className="h-4 w-4 text-sun" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {organizer.rating}
        </span>
        <span>{formatTours(organizer.tourCount)}</span>
        <span>{organizer.travelerCount}+ путешественников</span>
        <span>{formatYears(organizer.experienceYears)} опыта</span>
      </div>
      <p className="mt-2 text-sm text-slate">Языки: {organizer.languages.join(", ")}</p>
      {organizer.email?.trim() ? (
        <p className="mt-1 text-sm text-slate">
          Email:{" "}
          <a href={`mailto:${organizer.email}`} className="text-sky hover:underline">
            {organizer.email}
          </a>
        </p>
      ) : null}
    </>
  );
}

function OrganizerActions({
  organizer,
  compact = false,
}: {
  organizer: TourOrganizerDetail;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="mt-4 flex gap-2">
        <a
          href={`tel:${organizer.phone}`}
          className="flex-1 rounded-xl border border-gray-200 py-2 text-center text-sm font-medium hover:bg-gray-50"
        >
          Позвонить
        </a>
        <Link
          href="/contacts"
          className="flex-1 rounded-xl bg-patagonia py-2 text-center text-sm font-medium text-white hover:bg-patagonia-light"
        >
          Написать
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <a
        href={`tel:${organizer.phone}`}
        className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
      >
        Позвонить
      </a>
      <Link
        href="/contacts"
        className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
      >
        Написать
      </Link>
      <Link
        href="/tours"
        className="rounded-xl bg-patagonia px-5 py-2.5 text-sm font-medium text-white hover:bg-patagonia-light"
      >
        Все туры организатора
      </Link>
    </div>
  );
}

export default function OrganizerSection({
  organizer,
  comment,
  compact = false,
}: {
  organizer: TourOrganizerDetail;
  comment?: TourDetail["organizerComment"];
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full">
            <Image
              src={organizer.avatar}
              alt={organizer.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
          <div>
            <p className="font-semibold text-charcoal">{organizer.name}</p>
            <p className="flex items-center gap-1 text-sm text-slate">
              <svg className="h-3.5 w-3.5 text-sun" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {organizer.rating}
            </p>
          </div>
        </div>
        <OrganizerActions organizer={organizer} compact />
      </div>
    );
  }

  return (
    <section id="organizer" className="tour-section-target">
      <SectionHeading title="Организатор" />
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl sm:h-24 sm:w-24">
            <Image
              src={organizer.avatar}
              alt={organizer.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-charcoal">{organizer.name}</h3>
            <p className="text-sm text-slate">{organizer.role}</p>
            <OrganizerStats organizer={organizer} />
          </div>
        </div>

        {comment && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <p className="leading-relaxed text-slate">{comment.greeting}</p>

            {comment.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-charcoal">Рекомендации</h4>
                <ul className="mt-2 space-y-1.5">
                  {comment.recommendations.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-slate">
                      <span className="text-sky" aria-hidden>
                        →
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {comment.routeNotes && (
              <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate">
                  Особенности маршрута
                </p>
                <p className="mt-1 text-sm leading-relaxed text-charcoal">{comment.routeNotes}</p>
              </div>
            )}
          </div>
        )}

        <OrganizerActions organizer={organizer} />
      </div>
    </section>
  );
}
