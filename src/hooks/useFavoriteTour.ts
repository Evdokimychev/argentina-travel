"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  isItemFavorite,
  toggleFavorite,
} from "@/lib/favorites-store";
import { FAVORITES_UPDATED_EVENT, type FavoriteKind, type FavoriteTour } from "@/types/tourist";

export type FavoriteTourInput = Omit<FavoriteTour, "addedAt">;

export function useFavoriteTour(tour: FavoriteTourInput) {
  const kind: FavoriteKind = tour.kind ?? "tour";
  const { user, isAuthenticated, openAuth } = useAuth();
  const [favorited, setFavorited] = useState(false);

  const sync = useCallback(() => {
    if (!user) {
      setFavorited(false);
      return;
    }
    setFavorited(isItemFavorite(user.id, tour.tourSlug, kind));
  }, [tour.tourSlug, kind, user]);

  useEffect(() => {
    sync();
    window.addEventListener(FAVORITES_UPDATED_EVENT, sync);
    return () => window.removeEventListener(FAVORITES_UPDATED_EVENT, sync);
  }, [sync]);

  function handleToggle() {
    if (!isAuthenticated || !user) {
      openAuth();
      return;
    }

    const result = toggleFavorite(user, user.id, tour);
    if ("error" in result) return;
    setFavorited(result.favorited);
  }

  return { favorited, toggle: handleToggle, isAuthenticated };
}
