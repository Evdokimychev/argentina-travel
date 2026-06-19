"use client";

import { useCallback, useEffect, useState } from "react";
import GroupTripCard from "@/components/group-trips/GroupTripCard";
import type { GroupTripListingView } from "@/types/group-trips";
import {
  apiFetchGroupTrips,
  apiPatchOrganizerGroupTrip,
  isRemoteGroupTripsMode,
} from "@/lib/group-trips-api";
import {
  cabinetPageSubtitleClass,
  cabinetPageTitleClass,
  cabinetPanelClass,
} from "@/lib/cabinet-ui";

export default function OrganizerGroupTripsView() {
  const [listings, setListings] = useState<GroupTripListingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isRemoteGroupTripsMode()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await apiFetchGroupTrips({ organizer: true });
      setListings(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить наборы");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleConfirm(listingId: string) {
    setActionId(listingId);
    setError(null);
    try {
      await apiPatchOrganizerGroupTrip(listingId, "confirm");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось подтвердить набор");
    } finally {
      setActionId(null);
    }
  }

  async function handleCancel(listingId: string) {
    setActionId(listingId);
    setError(null);
    try {
      await apiPatchOrganizerGroupTrip(listingId, "cancel");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отменить набор");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className={cabinetPanelClass}>
      <h1 className={cabinetPageTitleClass}>Наборы группы</h1>
      <p className={cabinetPageSubtitleClass}>
        Подтверждайте состав, когда набран минимум участников. Оплата — отдельным этапом.
      </p>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="mt-6 text-sm text-slate">Загружаем…</p>
      ) : listings.length > 0 ? (
        <div className="mt-6 space-y-4">
          {listings.map((listing) => (
            <GroupTripCard
              key={listing.id}
              listing={listing}
              organizerMode
              showTourLink
              loadingId={actionId}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-3xl border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-slate">
          Пока нет наборов по вашим турам
        </p>
      )}
    </div>
  );
}
