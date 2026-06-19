"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import TourSection from "@/components/tour-detail/TourSection";
import GroupTripCard from "@/components/group-trips/GroupTripCard";
import type { TourDetail } from "@/types";
import type { GroupTripListingView } from "@/types/group-trips";
import {
  apiCreateGroupTripListing,
  apiFetchGroupTrips,
  apiJoinGroupTrip,
  apiLeaveGroupTrip,
  isRemoteGroupTripsMode,
} from "@/lib/group-trips-api";
import { formatDateShortWithYear } from "@/lib/utils";
import { cn } from "@/lib/cn";

interface GroupTripsSectionProps {
  tour: TourDetail;
}

function toIsoDate(value: string): string {
  return value.trim().slice(0, 10);
}

export default function GroupTripsSection({ tour }: GroupTripsSectionProps) {
  const { user, openAuth } = useAuth();
  const [listings, setListings] = useState<GroupTripListingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    tour.dates[0] ? toIsoDate(tour.dates[0].startDate) : ""
  );
  const [minParticipants, setMinParticipants] = useState(Math.max(tour.groupMin, 2));
  const [maxParticipants, setMaxParticipants] = useState(tour.groupMax || 8);
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const remoteEnabled = isRemoteGroupTripsMode();
  const dateOptions = useMemo(
    () =>
      tour.dates.map((date) => ({
        value: toIsoDate(date.startDate),
        label: formatDateShortWithYear(date.startDate),
      })),
    [tour.dates]
  );

  const refresh = useCallback(async () => {
    if (!remoteEnabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await apiFetchGroupTrips({ tourId: tour.id });
      setListings(next.filter((item) => item.status !== "cancelled"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить наборы");
    } finally {
      setLoading(false);
    }
  }, [remoteEnabled, tour.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!remoteEnabled || tour.dates.length === 0) {
    return null;
  }

  async function handleCreate() {
    if (!user) {
      openAuth();
      return;
    }
    if (!selectedDate) {
      setError("Выберите дату");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await apiCreateGroupTripListing({
        tourId: tour.id,
        slotDate: selectedDate,
        minParticipants,
        maxParticipants,
        description,
      });
      setDescription("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать набор");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(listingId: string) {
    if (!user) {
      openAuth();
      return;
    }
    setActionId(listingId);
    setError(null);
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
    setError(null);
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
    <TourSection
      id="group-trips"
      title="Совместная поездка"
      subtitle="Найдите попутчиков к выбранной дате и разделите стоимость тура"
    >
      <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky">
            <Users className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-charcoal">Создать набор группы</p>
            <p className="mt-1 text-sm text-slate">
              Укажите дату, минимальный и максимальный состав. Оплата и бронирование — отдельным
              шагом после подтверждения организатором.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-muted">Дата</span>
            <select
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2"
            >
              {dateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-muted">Мин. участников</span>
            <input
              type="number"
              min={2}
              max={50}
              value={minParticipants}
              onChange={(event) => setMinParticipants(Number(event.target.value))}
              className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-muted">Макс. участников</span>
            <input
              type="number"
              min={minParticipants}
              max={50}
              value={maxParticipants}
              onChange={(event) => setMaxParticipants(Number(event.target.value))}
              className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2 lg:col-span-1">
            <span className="mb-1 block text-xs font-medium text-muted">Комментарий</span>
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Кого ищете, пожелания"
              className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-4">
          <Button type="button" disabled={creating} onClick={() => void handleCreate()}>
            {creating ? "Создаём…" : "Создать набор"}
          </Button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-slate">Загружаем наборы…</p>
        ) : listings.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-slate">
            Пока нет открытых наборов к датам этого тура. Создайте первый или вернитесь позже.
          </p>
        ) : (
          listings.map((listing) => (
            <GroupTripCard
              key={listing.id}
              listing={listing}
              loadingId={actionId}
              onJoin={handleJoin}
              onLeave={handleLeave}
            />
          ))
        )}
      </div>

      {user ? (
        <p className={cn("mt-4 text-xs text-muted")}>
          Ваши наборы также доступны в{" "}
          <a href="/profile/group-trips" className="text-sky hover:underline">
            личном кабинете
          </a>
          .
        </p>
      ) : null}
    </TourSection>
  );
}
