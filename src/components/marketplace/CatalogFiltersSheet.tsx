"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FilterBar from "@/components/marketplace/FilterBar";
import type { TourFilters, TourListing } from "@/types";

type CatalogFiltersSheetProps = {
  tours: TourListing[];
  filters: TourFilters;
  onChange: (filters: TourFilters) => void;
  activeFilterCount: number;
};

export default function CatalogFiltersSheet({
  tours,
  filters,
  onChange,
  activeFilterCount,
}: CatalogFiltersSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="lg:hidden"
        onClick={() => setOpen(true)}
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
          </DialogHeader>
          <div className="px-5 pb-2 sm:px-6">
            <FilterBar tours={tours} filters={filters} onChange={onChange} />
          </div>
          <DialogFooter>
            <Button type="button" className="w-full sm:w-auto" onClick={() => setOpen(false)}>
              Показать результаты
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
