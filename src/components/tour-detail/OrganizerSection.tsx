import Image from "next/image";
import Link from "next/link";
import UserAvatar from "@/components/auth/UserAvatar";
import { TourDetail, TourOrganizerDetail } from "@/types";
import type { OrganizerTourGuide } from "@/types/organizer-tour";
import { buildTourContactHref } from "@/lib/tour-contact";
import {
  buildOrganizerCatalogHref,
  buildOrganizerPublicHref,
} from "@/lib/organizer-public";
import { resolveOrganizerExperienceStat } from "@/lib/organizer-experience";
import {
  resolveOrganizerRatingDisplay,
  resolveOrganizerTourCountDisplay,
  resolveOrganizerTravelerCountDisplay,
} from "@/lib/tour-public-display";
import {
  getCompanionGuides,
  getTourAuthorGuide,
  resolveTourTeamSectionMeta,
  shouldShowGuideBio,
} from "@/lib/tour-team-display";
import { formatTours } from "@/lib/pluralize";
import { cn } from "@/lib/cn";
import TourSection from "./TourSection";
import { buildExcursionGuideHref } from "@/lib/tripster/guide-mapper";
import { tourDetailBadgeSkyClass, tourDetailCardBorderClass, tourDetailInsetMutedClass } from "@/lib/tour-detail-ui";

function resolveTripsterGuideId(organizer: TourOrganizerDetail): number | null {
  if (organizer.slug?.startsWith("tripster-guide-")) {
    const id = Number.parseInt(organizer.slug.slice("tripster-guide-".length), 10);
    return Number.isFinite(id) ? id : null;
  }

  const directId = Number.parseInt(organizer.id, 10);
  if (Number.isFinite(directId) && directId > 0 && /гид/i.test(organizer.role)) {
    return directId;
  }

  return null;
}

function organizerProfileHref(organizer: TourOrganizerDetail): string | null {
  const tripsterGuideId = resolveTripsterGuideId(organizer);
  if (tripsterGuideId) return buildExcursionGuideHref(tripsterGuideId);

  const slug = organizer.slug ?? organizer.ownerUserId;
  return slug ? buildOrganizerPublicHref(slug) : null;
}

function organizerCatalogHref(organizer: TourOrganizerDetail): string {
  const tripsterGuideId = resolveTripsterGuideId(organizer);
  if (tripsterGuideId) return buildExcursionGuideHref(tripsterGuideId);

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

function RoleBadges({ organizerIsGuide }: { organizerIsGuide: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-sky/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky">
        Организатор
      </span>
      {organizerIsGuide ? (
        <span className={tourDetailBadgeSkyClass}>
          Гид тура
        </span>
      ) : null}
    </div>
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
  authorGuide,
}: {
  organizer: TourOrganizerDetail;
  comment?: TourDetail["organizerComment"];
  authorGuide: OrganizerTourGuide | null;
}) {
  const extendedText =
    organizer.extendedDescription?.trim() || comment?.greeting?.trim() || "";
  const recommendations = comment?.recommendations.filter((item) => item.trim()) ?? [];
  const routeNotes = comment?.routeNotes?.trim() || "";
  const authorBio =
    authorGuide && shouldShowGuideBio(authorGuide.bio, extendedText)
      ? authorGuide.bio.trim()
      : "";

  if (!extendedText && recommendations.length === 0 && !routeNotes && !authorBio) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      {extendedText ? (
        <p className="leading-relaxed text-slate">{extendedText}</p>
      ) : null}

      {authorBio ? (
        <div className={extendedText ? "mt-4 rounded-xl bg-sky/5 px-4 py-3" : undefined}>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky">
            О гиде на маршруте
          </p>
          <p className="mt-2 text-sm leading-relaxed text-charcoal">{authorBio}</p>
        </div>
      ) : null}

      {recommendations.length > 0 ? (
        <div className={extendedText || authorBio ? "mt-4" : undefined}>
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

function CompanionGuideCard({ guide }: { guide: OrganizerTourGuide }) {
  return (
    <article className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {guide.avatar ? (
          <Image
            src={guide.avatar}
            alt={guide.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-bold text-slate">
            {guide.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-charcoal">{guide.name}</h3>
        {guide.bio.trim() ? (
          <p className="mt-2 text-sm leading-relaxed text-slate">{guide.bio}</p>
        ) : null}
      </div>
    </article>
  );
}

export default function OrganizerSection({
  organizer,
  comment,
  tourSlug,
  guides,
  compact = false,
}: {
  organizer: TourOrganizerDetail;
  comment?: TourDetail["organizerComment"];
  tourSlug?: string;
  guides?: OrganizerTourGuide[];
  compact?: boolean;
}) {
  const authorGuide = getTourAuthorGuide(guides);
  const companionGuides = getCompanionGuides(guides, authorGuide);
  const sectionMeta = resolveTourTeamSectionMeta(guides);
  const profileHref = organizerProfileHref(organizer);

  if (compact) {
    const rating = resolveOrganizerRatingDisplay(organizer);

    return (
      <div className={cn(tourDetailCardBorderClass, "p-5")}>
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
            {sectionMeta.organizerIsGuide ? (
              <p className="mt-1 text-xs font-medium text-sky-dark">Организатор и гид тура</p>
            ) : null}
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
              <p className="mt-1 text-xs text-slate">{organizer.languages.join(", ")}</p>
            ) : null}
            {rating.show ? (
              <p
                className={`mt-1 flex items-center gap-1 text-sm ${rating.isNew ? "font-medium text-sky" : "text-slate"}`}
              >
                {!rating.isNew ? (
                  <svg className="h-3.5 w-3.5 text-sun" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00-.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
    <TourSection
      id="organizer"
      title={sectionMeta.title}
      subtitle={sectionMeta.subtitle}
    >
      <div
        className={cn(
          "rounded-2xl border bg-surface-muted/30 p-6 sm:p-8",
          sectionMeta.organizerIsGuide
            ? "border-sky/20 ring-1 ring-sky/10"
            : "border-gray-100"
        )}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {profileHref ? (
            <Link href={profileHref} className="shrink-0">
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
            <RoleBadges organizerIsGuide={sectionMeta.organizerIsGuide} />
            <OrganizerNameLink
              organizer={organizer}
              className="mt-3 block text-xl font-bold text-charcoal"
            />
            <p className="text-sm text-slate">
              {sectionMeta.organizerIsGuide
                ? "Организатор путешествий · ведёт тур лично"
                : organizer.role}
            </p>
            {organizer.statusText?.trim() ? (
              <p className="mt-2 text-sm font-medium text-sky">{organizer.statusText}</p>
            ) : organizer.shortDescription?.trim() ? (
              <p className="mt-2 text-sm leading-relaxed text-slate">{organizer.shortDescription}</p>
            ) : null}
            <OrganizerStats organizer={organizer} />
          </div>
        </div>

        <OrganizerCardBody
          organizer={organizer}
          comment={comment}
          authorGuide={authorGuide}
        />

        <OrganizerActions organizer={organizer} tourSlug={tourSlug} />
      </div>

      {companionGuides.length > 0 ? (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate">
            Также ведут тур
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {companionGuides.map((guide) => (
              <CompanionGuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        </div>
      ) : null}
    </TourSection>
  );
}
