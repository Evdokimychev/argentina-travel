"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  isItemFavorite,
  toggleFavoriteWithServerSync,
} from "@/lib/favorites-store";
import { FAVORITES_UPDATED_EVENT, type FavoriteKind, type FavoriteTour } from "@/types/tourist";
import { trackEntityFavorite } from "@/hooks/useInteractionTracking";

export type FavoriteTourInput = Omit<FavoriteTour, "addedAt">;

export function useFavoriteTour(tour: FavoriteTourInput) {
  const kind: FavoriteKind = tour.kind ?? "tour";
  const { user, isAuthenticated, openFavoritePrompt } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [busy, setBusy] = useState(false);

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
      openFavoritePrompt(tour);
      return;
    }

    if (busy) return;

    setBusy(true);
    void (async () => {
      try {
        const result = await toggleFavoriteWithServerSync(user, user.id, tour);
        if ("error" in result) return;

        setFavorited(result.favorited);
        if (result.favorited) {
          trackEntityFavorite(kind === "excursion" ? "excursion" : "tour", tour.tourSlug);
        }
      } finally {
        setBusy(false);
      }
    })();
  }

  return { favorited, toggle: handleToggle, isAuthenticated };
}
