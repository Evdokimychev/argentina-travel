import Image from "next/image";
import Link from "next/link";
import UserAvatar from "@/components/auth/UserAvatar";
import { TourDetail, TourOrganizerDetail } from "@/types";
import { buildTourContactHref } from "@/lib/tour-contact";
import {
  buildOrganizerCatalogHref,
  buildOrganizerPublicHref,
} from "@/lib/organizer-public";
import TourSection from "./TourSection";
import { resolveOrganizerExperienceStat } from "@/lib/organizer-experience";
import {
  resolveOrganizerRatingDisplay,
  resolveOrganizerTourCountDisplay,
  resolveOrganizerTravelerCountDisplay,
} from "@/lib/tour-public-display";
import { formatTours } from "@/lib/pluralize";

function organizerProfileHref(organizer: TourOrganizerDetail): string | null {
  const slug = organizer.slug ?? organizer.ownerUserId;
  return slug ? buildOrganizerPublicHref(slug) : null;
}

function organizerCatalogHref(organizer: TourOrganizerDetail): string {
  const slug = organizer.slug ?? organizer.ownerUserId;
  return slug ? buildOrganizerCatalogHref(slug) : "/tours";
}

function OrganizerAvatar({
  organizer,
  sizeClassName,
  imageSizes,
}: {
  organizer: TourOrganizerDetail;
  sizeClassName: string;
  imageSizes: string;
}) {
  if (organizer.avatar?.trim()) {
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-full ${sizeClassName}`}>
        <Image
          src={organizer.avatar}
          alt={organizer.name}
          fill
          className="object-cover"
          sizes={imageSizes}
        />
      </div>
    );
  }

  return (
    <UserAvatar name={organizer.name} avatarUrl={null} className={sizeClassName} />
  );
}

function OrganizerStats({ organizer }: { organizer: TourOrganizerDetail }) {
  const rating = resolveOrganizerRatingDisplay(organizer);
  const tourCountFallback = resolveOrganizerTourCountDisplay(organizer.tourCount);
  const travelerLabel = resolveOrganizerTravelerCountDisplay(organizer.travelerCount);

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate">
        {rating.show ? (
          <span
            className={`flex items-center gap-1 font-medium ${rating.isNew ? "text-sky" : "text-charcoal"}`}
          >
            {!rating.isNew ? (
              <svg className="h-4 w-4 text-sun" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00-.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ) : null}
            {rating.label}
          </span>
        ) : null}
        <span>{tourCountFallback ?? formatTours(organizer.tourCount)}</span>
        {travelerLabel ? <span>{travelerLabel}</span> : null}
        <span>{resolveOrganizerExperienceStat(organizer)}</span>
      </div>
      {organizer.languages.length > 0 ? (
        <p className="mt-2 text-sm text-slate">Языки: {organizer.languages.join(", ")}</p>
      ) : null}
    </>
  );
}

function OrganizerActions({
  organizer,
  tourSlug,
  compact = false,
}: {
  organizer: TourOrganizerDetail;
  tourSlug?: string;
  compact?: boolean;
}) {
  const contactHref = tourSlug ? buildTourContactHref(tourSlug) : "/contacts";
  const catalogHref = organizerCatalogHref(organizer);

  if (compact) {
    return (
      <div className="mt-4 flex gap-2">
        <Link
          href={contactHref}
          className="flex-1 rounded-xl border border-gray-200 py-2 text-center text-sm font-medium hover:bg-gray-50"
        >
          Написать
        </Link>
        <Link
          href={catalogHref}
          className="flex-1 rounded-xl bg-sky py-2 text-center text-sm font-medium text-white hover:bg-sky-dark"
        >
          Туры
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <Link
        href={contactHref}
        className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
      >
        Написать
      </Link>
      <Link
        href={catalogHref}
        className="rounded-xl bg-sky px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-dark"
      >
        Все туры организатора
      </Link>
    </div>
  );
}

function OrganizerCardBody({
  organizer,
  comment,
}: {
  organizer: TourOrganizerDetail;
  comment?: TourDetail["organizerComment"];
}) {
  const extendedText =
    organizer.extendedDescription?.trim() || comment?.greeting?.trim() || "";
  const recommendations = comment?.recommendations.filter((item) => item.trim()) ?? [];
  const routeNotes = comment?.routeNotes?.trim() || "";

  if (!extendedText && recommendations.length === 0 && !routeNotes) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      {extendedText ? (
        <p className="leading-relaxed text-slate">{extendedText}</p>
      ) : null}

      {recommendations.length > 0 ? (
        <div className={extendedText ? "mt-4" : undefined}>
          <h4 className="text-sm font-semibold text-charcoal">Рекомендации</h4>
          <ul className="mt-2 space-y-1.5">
            {recommendations.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-slate">
                <span className="text-sky" aria-hidden>
                  →
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {routeNotes ? (
        <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate">
            Особенности маршрута
          </p>
          <p className="mt-1 text-sm leading-relaxed text-charcoal">{routeNotes}</p>
        </div>
      ) : null}
    </div>
  );
}

function OrganizerNameLink({
  organizer,
  className,
}: {
  organizer: TourOrganizerDetail;
  className?: string;
}) {
  const href = organizerProfileHref(organizer);
  if (!href) {
    return <span className={className}>{organizer.name}</span>;
  }
  return (
    <Link href={href} className={`hover:text-brand hover:underline ${className ?? ""}`}>
      {organizer.name}
    </Link>
  );
}

export default function OrganizerSection({
  organizer,
  comment,
  tourSlug,
  compact = false,
}: {
  organizer: TourOrganizerDetail;
  comment?: TourDetail["organizerComment"];
  tourSlug?: string;
  compact?: boolean;
}) {
  if (compact) {
    const rating = resolveOrganizerRatingDisplay(organizer);
    const profileHref = organizerProfileHref(organizer);

    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          {profileHref ? (
            <Link href={profileHref} className="shrink-0">
              <OrganizerAvatar
                organizer={organizer}
                sizeClassName="h-12 w-12"
                imageSizes="48px"
              />
            </Link>
          ) : (
            <OrganizerAvatar
              organizer={organizer}
              sizeClassName="h-12 w-12"
              imageSizes="48px"
            />
          )}
          <div className="min-w-0">
            <OrganizerNameLink organizer={organizer} className="font-semibold text-charcoal" />
            {organizer.statusText?.trim() ? (
              <p className="mt-0.5 line-clamp-2 text-xs font-medium text-sky">
                {organizer.statusText}
              </p>
            ) : organizer.shortDescription?.trim() ? (
              <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate">
                {organizer.shortDescription}
              </p>
            ) : null}
            {organizer.languages.length > 0 ? (
              <p className="mt-1 text-xs text-slate">
                {organizer.languages.join(", ")}
              </p>
            ) : null}
            {rating.show ? (
              <p
                className={`mt-1 flex items-center gap-1 text-sm ${rating.isNew ? "font-medium text-sky" : "text-slate"}`}
              >
                {!rating.isNew ? (
                  <svg className="h-3.5 w-3.5 text-sun" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ) : null}
                {rating.label}
              </p>
            ) : null}
          </div>
        </div>
        <OrganizerActions organizer={organizer} tourSlug={tourSlug} compact />
      </div>
    );
  }

  return (
    <TourSection id="organizer" title="Организатор">
      <div className="rounded-2xl border border-gray-100 bg-surface-muted/30 p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {organizerProfileHref(organizer) ? (
            <Link href={organizerProfileHref(organizer)!} className="shrink-0">
              <OrganizerAvatar
                organizer={organizer}
                sizeClassName="h-20 w-20 sm:h-24 sm:w-24"
                imageSizes="96px"
              />
            </Link>
          ) : (
            <OrganizerAvatar
              organizer={organizer}
              sizeClassName="h-20 w-20 sm:h-24 sm:w-24"
              imageSizes="96px"
            />
          )}
          <div className="min-w-0 flex-1">
            <OrganizerNameLink
              organizer={organizer}
              className="text-xl font-bold text-charcoal"
            />
            <p className="text-sm text-slate">{organizer.role}</p>
            {organizer.statusText?.trim() ? (
              <p className="mt-2 text-sm font-medium text-sky">{organizer.statusText}</p>
            ) : organizer.shortDescription?.trim() ? (
              <p className="mt-2 text-sm leading-relaxed text-slate">{organizer.shortDescription}</p>
            ) : null}
            <OrganizerStats organizer={organizer} />
          </div>
        </div>

        <OrganizerCardBody organizer={organizer} comment={comment} />

        <OrganizerActions organizer={organizer} tourSlug={tourSlug} />
      </div>
    </TourSection>
  );
}
