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
import ExcursionFilterBar from "@/components/excursions/ExcursionFilterBar";
import type { ExcursionCatalogFilters } from "@/lib/excursion-catalog-filters";

type ExcursionCatalogFiltersSheetProps = {
  filters: ExcursionCatalogFilters;
  priceMax: number;
  hasUsdPrices: boolean;
  onChange: (filters: ExcursionCatalogFilters) => void;
  activeFilterCount: number;
};

export default function ExcursionCatalogFiltersSheet({
  filters,
  priceMax,
  hasUsdPrices,
  onChange,
  activeFilterCount,
}: ExcursionCatalogFiltersSheetProps) {
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
            <DialogTitle>Фильтры экскурсий</DialogTitle>
          </DialogHeader>
          <div className="px-5 pb-2 sm:px-6">
            <ExcursionFilterBar
              filters={filters}
              priceMax={priceMax}
              hasUsdPrices={hasUsdPrices}
              onChange={onChange}
            />
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
