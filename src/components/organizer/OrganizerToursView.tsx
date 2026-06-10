"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  MoreHorizontal,
  PencilLine,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ORGANIZER_TOUR_LISTINGS } from "@/data/organizer-tours";
import { useAuth } from "@/context/AuthContext";
import { getOrganizerTourListingsForUser, createOrganizerTour } from "@/lib/organizer-tour-store";
import { cn } from "@/lib/cn";
import { formatDays, formatWithWord, pluralRu } from "@/lib/pluralize";
import type { OrganizerTourListing, OrganizerTourStatus, OrganizerTourType } from "@/types/organizer-tour";
import { ORGANIZER_TOURS_UPDATED_EVENT } from "@/types/organizer-tour";

type ArchiveTab = "active" | "archive";
type TypeFilter = "all" | OrganizerTourType;
type StatusFilter = "all" | OrganizerTourStatus;

const LIST_TABS: { id: ArchiveTab; label: string }[] = [
  { id: "active", label: "Активные" },
  { id: "archive", label: "В архиве" },
];

function excursionsWord(count: number): string {
  return pluralRu(count, "экскурсия", "экскурсии", "экскурсий");
}

function formatToursAndExcursions(tours: number, excursions: number): string {
  const tourPart = formatWithWord(tours, "тур", "тура", "туров");
  const excursionPart = `${excursions} ${excursionsWord(excursions)}`;
  return `${tourPart} и ${excursionPart}`;
}

function StatusBadge({ status }: { status: OrganizerTourStatus }) {
  if (status === "published") {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        Опубликовано
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-slate">
      Черновик
    </span>
  );
}

function TourListingCard({ tour }: { tour: OrganizerTourListing }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={tour.image}
          alt={tour.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/55 via-charcoal/10 to-charcoal/5" />

        {tour.coverLabel ? (
          <span className="pointer-events-none absolute bottom-3 left-3 text-2xl font-black tracking-[0.16em] text-white/30 sm:text-3xl">
            {tour.coverLabel}
          </span>
        ) : null}

        {tour.isPreliminaryProgram ? (
          <span className="absolute left-3 top-3 max-w-[calc(100%-5.5rem)] rounded-md bg-brand px-2 py-1 text-[10px] font-semibold leading-snug text-white shadow-sm">
            Предв. программа
          </span>
        ) : null}

        <span className="absolute bottom-3 right-3 rounded-md bg-white/95 px-2 py-1 text-[11px] font-semibold text-charcoal shadow-sm">
          {formatDays(tour.durationDays)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3">
          <StatusBadge status={tour.status} />
          <h3 className="mt-2 line-clamp-2 font-display text-sm font-bold leading-snug text-charcoal sm:text-base">
            {tour.title}
          </h3>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate">
            <span className="truncate">{tour.partnerName}</span>
            {tour.partnerUrl ? (
              <Link
                href={tour.partnerUrl}
                className="shrink-0 text-brand transition-colors hover:text-brand-dark"
                aria-label="Открыть на сайте"
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-auto flex gap-2 pt-1">
          <Link
            href={`/organizer/tours/${tour.id}/edit`}
            className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2 text-xs font-semibold text-charcoal transition-colors hover:bg-gray-100"
          >
            <PencilLine className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            <span className="truncate">Редактировать</span>
          </Link>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-slate transition-colors hover:bg-gray-100 hover:text-charcoal"
            aria-label="Ещё"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function OrganizerToursView() {
  const router = useRouter();
  const { user } = useAuth();
  const [archiveTab, setArchiveTab] = useState<ArchiveTab>("active");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tours, setTours] = useState<OrganizerTourListing[]>(ORGANIZER_TOUR_LISTINGS);

  useEffect(() => {
    if (!user) return;

    function refreshTours() {
      setTours(getOrganizerTourListingsForUser(user!.id));
    }

    refreshTours();

    window.addEventListener(ORGANIZER_TOURS_UPDATED_EVENT, refreshTours);
    window.addEventListener("focus", refreshTours);

    return () => {
      window.removeEventListener(ORGANIZER_TOURS_UPDATED_EVENT, refreshTours);
      window.removeEventListener("focus", refreshTours);
    };
  }, [user]);

  const baseList = useMemo(
    () =>
      tours.filter(
        (tour) =>
          !tour.deleted && (archiveTab === "active" ? !tour.archived : tour.archived)
      ),
    [archiveTab, tours]
  );

  function handleCreateTour() {
    const result = createOrganizerTour(user);
    if ("error" in result) return;
    router.push(`/organizer/tours/${result.draft.id}/edit`);
  }

  const filteredList = useMemo(() => {
    const query = search.trim().toLowerCase();

    return baseList.filter((tour) => {
      if (typeFilter !== "all" && tour.type !== typeFilter) return false;
      if (statusFilter !== "all" && tour.status !== statusFilter) return false;
      if (!query) return true;
      return (
        tour.title.toLowerCase().includes(query) ||
        tour.coverLabel?.toLowerCase().includes(query)
      );
    });
  }, [baseList, search, statusFilter, typeFilter]);

  const tourCount = baseList.filter((tour) => tour.type === "tour").length;
  const excursionCount = baseList.filter((tour) => tour.type === "excursion").length;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 px-3 scrollbar-hide sm:px-4">
        {LIST_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setArchiveTab(tab.id)}
            className={cn(
              "relative shrink-0 px-3 py-3.5 text-sm font-medium transition-colors sm:px-4",
              archiveTab === tab.id
                ? "text-charcoal after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand sm:after:inset-x-3"
                : "text-slate hover:text-charcoal"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
              Туры и экскурсии
            </h1>
            <p className="mt-1 text-sm text-slate">
              {formatToursAndExcursions(tourCount, excursionCount)}
            </p>
          </div>
          <Button type="button" className="shrink-0 gap-2 self-start" onClick={handleCreateTour}>
            <Plus className="h-4 w-4" />
            Добавить тур или экскурсию
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="relative lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по турам"
              className="pl-10"
            />
          </div>

          <div>
            <label htmlFor="organizer-tour-type-filter" className="sr-only">
              Тип тура
            </label>
            <select
              id="organizer-tour-type-filter"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
              className="flex h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-charcoal focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="all">Туры и экскурсии</option>
              <option value="tour">Только туры</option>
              <option value="excursion">Только экскурсии</option>
            </select>
          </div>

          <div>
            <label htmlFor="organizer-tour-status-filter" className="sr-only">
              Статус публикации тура
            </label>
            <select
              id="organizer-tour-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="flex h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-charcoal focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="all">Опубликованные и черновики</option>
              <option value="published">Опубликованные</option>
              <option value="draft">Черновики</option>
            </select>
          </div>
        </div>

        {filteredList.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredList.map((tour) => (
              <TourListingCard key={tour.id} tour={tour} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
            <p className="font-display text-lg font-bold text-charcoal">Ничего не найдено</p>
            <p className="mt-2 text-sm text-slate">
              {archiveTab === "archive"
                ? "В архиве пока нет туров по выбранным фильтрам."
                : "Измените фильтры или добавьте новый тур."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
