"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserFavorites } from "@/lib/favorites-store";
import { FAVORITES_UPDATED_EVENT, type FavoriteTour } from "@/types/tourist";
import FavoriteButton from "@/components/profile/FavoriteButton";
import FormattedPrice from "@/components/FormattedPrice";

export default function ProfileFavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteTour[]>([]);

  useEffect(() => {
    if (!user) return;

    function refresh() {
      setFavorites(getUserFavorites(user!.id));
    }

    refresh();
    window.addEventListener(FAVORITES_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(FAVORITES_UPDATED_EVENT, refresh);
  }, [user]);

  if (!user) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-heading text-xl font-bold text-charcoal">Избранные туры</h2>
      <p className="mt-1 text-sm text-slate">Туры, которые вы сохранили для будущих поездок</p>

      {favorites.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {favorites.map((favorite) => (
            <article
              key={favorite.tourSlug}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={favorite.tourImage}
                  alt={favorite.tourTitle}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 400px"
                />
                <div className="absolute right-3 top-3">
                  <FavoriteButton
                    tourId={favorite.tourId}
                    tourSlug={favorite.tourSlug}
                    tourTitle={favorite.tourTitle}
                    tourImage={favorite.tourImage}
                    region={favorite.region}
                    country={favorite.country}
                    priceUsd={favorite.priceUsd}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm"
                  />
                </div>
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 font-heading text-base font-bold text-charcoal">
                  {favorite.tourTitle}
                </h3>
                {favorite.region ? (
                  <p className="mt-1 text-sm text-slate">
                    {favorite.region}
                    {favorite.country ? `, ${favorite.country}` : ""}
                  </p>
                ) : null}
                {favorite.priceUsd != null ? (
                  <p className="mt-2 text-sm font-semibold text-charcoal">
                    от <FormattedPrice priceUsd={favorite.priceUsd} className="inline" />
                  </p>
                ) : null}
                <Link
                  href={`/tours/${favorite.tourSlug}`}
                  className="mt-4 inline-flex text-sm font-medium text-brand hover:underline"
                >
                  Открыть тур
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-slate/40" strokeWidth={1.5} />
          <p className="mt-4 font-medium text-charcoal">Избранное пока пусто</p>
          <p className="mt-2 text-sm text-slate">
            Нажмите на сердечко в каталоге или на странице тура, чтобы сохранить понравившийся маршрут.
          </p>
          <Link
            href="/tours"
            className="mt-4 inline-flex text-sm font-medium text-brand hover:underline"
          >
            Перейти в каталог
          </Link>
        </div>
      )}
    </div>
  );
}
