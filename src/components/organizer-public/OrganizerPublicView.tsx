"use client";

import Image from "next/image";
import Link from "next/link";
import UserAvatar from "@/components/auth/UserAvatar";
import MarketplaceTourCard from "@/components/marketplace/MarketplaceTourCard";
import type { PublicOrganizerProfile } from "@/lib/organizer-public";
import {
  buildOrganizerCatalogHref,
} from "@/lib/organizer-public";
import { buildTourContactHref } from "@/lib/tour-contact";
import type { TourListing } from "@/types";
import { useRepositoryTourListings } from "@/hooks/useRepositoryTourListings";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MapPin } from "lucide-react";
import { tripsWord } from "@/lib/pluralize";

interface OrganizerPublicViewProps {
  profile: PublicOrganizerProfile;
  initialTours: TourListing[];
}

export default function OrganizerPublicView({
  profile,
  initialTours,
}: OrganizerPublicViewProps) {
  const allTours = useRepositoryTourListings(initialTours);
  const tours = allTours.filter(
    (tour) =>
      tour.organizerOwnerId === profile.slug || tour.organizer?.slug === profile.slug,
  );
  const sampleTourSlug = tours[0]?.slug;
  const contactHref = sampleTourSlug
    ? buildTourContactHref(sampleTourSlug)
    : "/contacts";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {profile.avatar?.trim() ? (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full sm:h-28 sm:w-28">
              <Image
                src={profile.avatar}
                alt={profile.name}
                fill
                className="object-cover"
                sizes="112px"
              />
            </div>
          ) : (
            <UserAvatar name={profile.name} avatarUrl={null} className="h-24 w-24 sm:h-28 sm:w-28" />
          )}

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">
              {profile.name}
            </h1>
            {profile.statusText ? (
              <p className="mt-2 text-sm font-medium text-sky">{profile.statusText}</p>
            ) : null}
            {profile.shortDescription ? (
              <p className="mt-3 text-sm leading-relaxed text-slate">{profile.shortDescription}</p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate">
              <span
                className={`font-medium ${profile.ratingIsNew ? "text-sky" : "text-charcoal"}`}
              >
                {profile.ratingLabel}
              </span>
              <span>{profile.tourCountLabel}</span>
              {profile.travelerCountLabel ? <span>{profile.travelerCountLabel}</span> : null}
              <span>{profile.experienceStat}</span>
            </div>

            {profile.languages.length > 0 ? (
              <p className="mt-2 text-sm text-slate">
                Языки: {profile.languages.join(", ")}
              </p>
            ) : null}
          </div>
        </div>

        {profile.extendedDescription ? (
          <div className="mt-8 border-t border-gray-100 pt-8">
            <p className="leading-relaxed text-slate">{profile.extendedDescription}</p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={contactHref}>
            <Button>Написать организатору</Button>
          </Link>
          {tours.length > 0 ? (
            <Link href={buildOrganizerCatalogHref(profile.slug)}>
              <Button variant="outline">Все туры в каталоге</Button>
            </Link>
          ) : null}
        </div>
      </div>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-charcoal">
              Туры организатора
            </h2>
            <p className="mt-1 text-sm text-slate">
              {tours.length > 0
                ? `${tours.length} ${tripsWord(tours.length)}`
                : "Пока нет опубликованных туров"}
            </p>
          </div>
          {tours.length > 0 ? (
            <Link
              href={buildOrganizerCatalogHref(profile.slug)}
              className="text-sm font-medium text-brand hover:underline"
            >
              Открыть в каталоге →
            </Link>
          ) : null}
        </div>

        {tours.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {tours.map((tour) => (
              <MarketplaceTourCard key={tour.id} tour={tour} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MapPin}
            title="Туров пока нет"
            description="Организатор готовит новые маршруты."
            action={{ label: "Смотреть все туры площадки", href: "/tours", variant: "outline" }}
            className="mt-6"
          />
        )}
      </section>
    </div>
  );
}
