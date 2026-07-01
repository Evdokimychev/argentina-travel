"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserFavorites, refreshRemoteFavorites } from "@/lib/favorites-store";
import { favoriteHref } from "@/lib/favorite-href";
import { FAVORITES_UPDATED_EVENT, type FavoriteTour } from "@/types/tourist";
import FavoriteButton from "@/components/profile/FavoriteButton";
import ProfileSavedArticlesPanel from "@/components/profile/ProfileSavedArticlesPanel";
import ExcursionFavoriteButton from "@/components/excursions/ExcursionFavoriteButton";
import PlaceFavoriteButton from "@/components/places/PlaceFavoriteButton";
import { favoriteOverlayButtonClass } from "@/lib/favorite-button-styles";
import FormattedPrice from "@/components/FormattedPrice";
import { cn } from "@/lib/cn";
import {
  cabinetCardClass,
  cabinetLinkClass,
  cabinetPageSubtitleClass,
  cabinetPageTitleClass,
  cabinetPanelClass,
} from "@/lib/cabinet-ui";
import { useSavedArticles } from "@/hooks/useSavedArticles";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";

function isPlaceFavorite(favorite: FavoriteTour): boolean {
  return (favorite.kind ?? "tour") === "place";
}

function isTourOrExcursionFavorite(favorite: FavoriteTour): boolean {
  return !isPlaceFavorite(favorite);
}

export default function ProfileFavoritesPage() {
  const { user } = useAuth();
  const { t } = useLocaleCurrency();
  const { saved: savedArticles } = useSavedArticles();
  const [favorites, setFavorites] = useState<FavoriteTour[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    let active = true;

    function refresh() {
      if (!active) return;
      setFavorites(getUserFavorites(userId));
    }

    refresh();
    void (async () => {
      try {
        await refreshRemoteFavorites(user, userId);
        refresh();
      } finally {
        if (active) setLoaded(true);
      }
    })();

    window.addEventListener(FAVORITES_UPDATED_EVENT, refresh);
    return () => {
      active = false;
      window.removeEventListener(FAVORITES_UPDATED_EVENT, refresh);
    };
  }, [user]);

  const placeFavorites = useMemo(
    () => favorites.filter(isPlaceFavorite),
    [favorites],
  );
  const tourFavorites = useMemo(
    () => favorites.filter(isTourOrExcursionFavorite),
    [favorites],
  );

  if (!user) return null;

  const hasPlaceFavorites = placeFavorites.length > 0;
  const hasTourFavorites = tourFavorites.length > 0;
  const hasSavedArticles = savedArticles.length > 0;
  const hasAnyFavorites = hasPlaceFavorites || hasTourFavorites || hasSavedArticles;

  return (
    <div className={cabinetPanelClass}>
      <h1 className={cabinetPageTitleClass}>{t("profile.favorites.title")}</h1>
      <p className={cabinetPageSubtitleClass}>{t("profile.favorites.subtitle")}</p>

      <ProfileSavedArticlesPanel className="mt-8" />

      {!loaded && !hasAnyFavorites ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2" aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn(cabinetCardClass, "overflow-hidden")}>
              <div className="aspect-[16/10] animate-pulse bg-surface-muted" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-20 animate-pulse rounded bg-surface-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-surface-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-surface-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {hasPlaceFavorites ? (
        <section className={cn(hasSavedArticles ? "mt-10 space-y-4" : "mt-6")}>
          <h2 className="font-heading text-lg font-bold text-charcoal">
            {t("profile.favorites.placesSection")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {placeFavorites.map((favorite) => (
              <article
                key={`place:${favorite.tourSlug}`}
                className={cn(cabinetCardClass, "overflow-hidden")}
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={favorite.tourImage || "/images/placeholder-tour.jpg"}
                    alt={favorite.tourTitle}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 400px"
                  />
                  <div className="absolute right-3 top-3">
                    <PlaceFavoriteButton
                      place={{
                        id: favorite.tourId,
                        slug: favorite.tourSlug,
                        name: favorite.tourTitle,
                        coverImage: favorite.tourImage,
                        region: favorite.region ?? "",
                      }}
                      className={favoriteOverlayButtonClass}
                      iconClassName="h-4 w-4"
                    />
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-sky">
                    {t("profile.favorites.typePlace")}
                  </span>
                  <h3 className="line-clamp-2 font-heading text-base font-bold text-charcoal">
                    {favorite.tourTitle}
                  </h3>
                  {favorite.region ? (
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {favorite.region}
                      {favorite.country ? `, ${favorite.country}` : ""}
                    </p>
                  ) : null}
                  <Link
                    href={favoriteHref(favorite)}
                    className={cn(cabinetLinkClass, "mt-4 inline-flex text-sm")}
                  >
                    {t("profile.favorites.openPlace")}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {hasTourFavorites ? (
        <section
          className={cn(
            hasPlaceFavorites || hasSavedArticles ? "mt-10 space-y-4" : "mt-6",
          )}
        >
          {hasPlaceFavorites || hasSavedArticles ? (
            <h2 className="font-heading text-lg font-bold text-charcoal">
              {t("profile.favorites.toursSection")}
            </h2>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            {tourFavorites.map((favorite) => (
              <article
                key={`${favorite.kind ?? "tour"}:${favorite.tourSlug}`}
                className={cn(cabinetCardClass, "overflow-hidden")}
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={favorite.tourImage || "/images/placeholder-tour.jpg"}
                    alt={favorite.tourTitle}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 400px"
                  />
                  <div className="absolute right-3 top-3">
                    {(favorite.kind ?? "tour") === "excursion" ? (
                      <ExcursionFavoriteButton
                        excursion={{
                          id: Number.parseInt(favorite.tourId, 10) || 0,
                          slug: favorite.tourSlug,
                          title: favorite.tourTitle,
                          coverImage: favorite.tourImage,
                          cityName: favorite.cityName ?? "",
                        }}
                        className={favoriteOverlayButtonClass}
                        iconClassName="h-4 w-4"
                      />
                    ) : (
                      <FavoriteButton
                        tourId={favorite.tourId}
                        tourSlug={favorite.tourSlug}
                        tourTitle={favorite.tourTitle}
                        tourImage={favorite.tourImage}
                        region={favorite.region}
                        country={favorite.country}
                        priceUsd={favorite.priceUsd}
                        className={favoriteOverlayButtonClass}
                        iconClassName="h-4 w-4"
                      />
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-sky">
                    {(favorite.kind ?? "tour") === "excursion"
                      ? t("profile.favorites.typeExcursion")
                      : t("profile.favorites.typeTour")}
                  </span>
                  <h3 className="line-clamp-2 font-heading text-base font-bold text-charcoal">
                    {favorite.tourTitle}
                  </h3>
                  {favorite.cityName || favorite.region ? (
                    <p className="mt-1 text-sm text-slate">
                      {favorite.cityName ?? favorite.region}
                      {favorite.country ? `, ${favorite.country}` : ""}
                    </p>
                  ) : null}
                  {favorite.priceUsd != null ? (
                    <p className="mt-2 text-sm font-semibold text-charcoal">
                      {t("profile.favorites.fromPrice")}{" "}
                      <FormattedPrice priceUsd={favorite.priceUsd} className="inline" />
                    </p>
                  ) : null}
                  <Link
                    href={favoriteHref(favorite)}
                    className={cn(cabinetLinkClass, "mt-4 inline-flex text-sm")}
                  >
                    {(favorite.kind ?? "tour") === "excursion"
                      ? t("profile.favorites.openExcursion")
                      : t("profile.favorites.openTour")}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {loaded && !hasAnyFavorites ? (
        <div className="mt-8 rounded-panel border border-dashed border-border-subtle bg-surface-muted/60 px-6 py-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-slate/40" strokeWidth={1.5} />
          <p className="mt-4 font-medium text-charcoal">{t("profile.favorites.emptyTitle")}</p>
          <p className="mt-2 text-sm text-slate">{t("profile.favorites.emptyDescription")}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/tours" className={cn(cabinetLinkClass, "text-sm")}>
              {t("profile.favorites.catalogTours")}
            </Link>
            <Link href="/excursions" className={cn(cabinetLinkClass, "text-sm")}>
              {t("profile.favorites.catalogExcursions")}
            </Link>
            <Link href="/places" className={cn(cabinetLinkClass, "text-sm")}>
              {t("profile.favorites.catalogPlaces")}
            </Link>
            <Link href="/blog" className={cn(cabinetLinkClass, "text-sm")}>
              Журнал
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
