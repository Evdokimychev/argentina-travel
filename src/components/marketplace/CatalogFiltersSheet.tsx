"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import FilterBar from "@/components/marketplace/FilterBar";
import type { TourFilters, TourListing } from "@/types";
import { filterTours } from "@/lib/filter-tours";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { formatTours } from "@/lib/pluralize";

type CatalogFiltersSheetProps = {
  tours: TourListing[];
  filters: TourFilters;
  onChange: (filters: TourFilters) => void;
  activeFilterCount: number;
  defaultFilters: TourFilters;
};

export default function CatalogFiltersSheet({
  tours,
  filters,
  onChange,
  activeFilterCount,
  defaultFilters,
}: CatalogFiltersSheetProps) {
  const [open, setOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);
  const { currency } = useLocaleCurrency();
  const draftResultCount = useMemo(
    () => filterTours(tours, draftFilters, currency).length,
    [tours, draftFilters, currency],
  );

  function openSheet() {
    setDraftFilters(filters);
    setOpen(true);
  }

  function applyFilters() {
    onChange(draftFilters);
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="lg:hidden min-h-11"
        onClick={openSheet}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        Фильтры
        {activeFilterCount > 0 ? (
          <span className="ml-1 rounded-full bg-sky/10 px-1.5 py-0.5 text-xs font-semibold text-sky">
            {activeFilterCount}
          </span>
        ) : null}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg sm:max-w-xl" showClose>
          <DialogHeader>
            <DialogTitle>Фильтры каталога</DialogTitle>
            <DialogDescription className="sr-only">
              Настройте параметры поиска туров и примените фильтры
            </DialogDescription>
          </DialogHeader>
          <div className="max-w-full overflow-x-hidden px-5 pb-2 sm:px-6">
            <FilterBar
              tours={tours}
              filters={draftFilters}
              onChange={setDraftFilters}
              inline
            />
          </div>
          <DialogFooter className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 sm:flex">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDraftFilters(defaultFilters)}
            >
              Сбросить
            </Button>
            <Button type="button" className="min-w-0 sm:w-auto" onClick={applyFilters}>
              Показать {formatTours(draftResultCount)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
