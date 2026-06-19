"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import GroupTripCard from "@/components/group-trips/GroupTripCard";
import type { GroupTripListingView } from "@/types/group-trips";
import {
  apiFetchGroupTrips,
  apiJoinGroupTrip,
  apiLeaveGroupTrip,
  isRemoteGroupTripsMode,
} from "@/lib/group-trips-api";
import {
  cabinetLinkClass,
  cabinetPageSubtitleClass,
  cabinetPageTitleClass,
  cabinetPanelClass,
} from "@/lib/cabinet-ui";

export default function ProfileGroupTripsView() {
  const { user } = useAuth();
  const [listings, setListings] = useState<GroupTripListingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !isRemoteGroupTripsMode()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await apiFetchGroupTrips({ mine: true });
      setListings(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить наборы");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!user) return null;

  async function handleJoin(listingId: string) {
    setActionId(listingId);
    try {
      await apiJoinGroupTrip(listingId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось присоединиться");
    } finally {
      setActionId(null);
    }
  }

  async function handleLeave(listingId: string) {
    setActionId(listingId);
    try {
      await apiLeaveGroupTrip(listingId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось выйти из набора");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className={cabinetPanelClass}>
      <h1 className={cabinetPageTitleClass}>Совместные поездки</h1>
      <p className={cabinetPageSubtitleClass}>
        Наборы группы, в которых вы участвуете или которые создали
      </p>

      {!isRemoteGroupTripsMode() ? (
        <p className="mt-6 text-sm text-slate">Функция доступна при подключённом Supabase.</p>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="mt-6 text-sm text-slate">Загружаем…</p>
      ) : listings.length > 0 ? (
        <div className="mt-6 space-y-4">
          {listings.map((listing) => (
            <GroupTripCard
              key={listing.id}
              listing={listing}
              showTourLink
              loadingId={actionId}
              onJoin={handleJoin}
              onLeave={handleLeave}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-gray-200 bg-surface-muted/60 px-6 py-12 text-center">
          <Users className="mx-auto h-10 w-10 text-slate/40" strokeWidth={1.5} />
          <p className="mt-4 font-medium text-charcoal">Пока нет активных наборов</p>
          <p className="mt-2 text-sm text-slate">
            На странице тура можно создать набор или присоединиться к существующему
          </p>
          <Link href="/tours" className={cabinetLinkClass + " mt-4 inline-flex text-sm"}>
            Перейти в каталог
          </Link>
        </div>
      )}
    </div>
  );
}
