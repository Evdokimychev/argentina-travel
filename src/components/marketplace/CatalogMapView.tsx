"use client";

import { useEffect, useRef, useState } from "react";
import { TourListing } from "@/types";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import TourMapListItem from "./TourMapListItem";
import ToursCatalogMap from "./ToursCatalogMap";

interface CatalogMapViewProps {
  tours: TourListing[];
}

export default function CatalogMapView({ tours }: CatalogMapViewProps) {
  const { currency, locale } = useLocaleCurrency();
  const [selectedId, setSelectedId] = useState<string | null>(tours[0]?.id ?? null);
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  useEffect(() => {
    if (tours.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !tours.some((t) => t.id === selectedId)) {
      setSelectedId(tours[0].id);
    }
  }, [tours, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    itemRefs.current.get(selectedId)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex min-h-[520px] flex-col lg:min-h-[640px] lg:flex-row">
        <div className="flex flex-col border-b border-gray-100 lg:w-[42%] lg:border-b-0 lg:border-r">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-charcoal">На карте</p>
            <p className="mt-0.5 text-xs text-slate">
              Выберите тур в списке или на карте
            </p>
          </div>

          {tours.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate">
              Нет туров для отображения на карте
            </div>
          ) : (
            <ul className="max-h-[320px] overflow-y-auto lg:max-h-none lg:flex-1">
              {tours.map((tour) => (
                <TourMapListItem
                  key={tour.id}
                  tour={tour}
                  selected={selectedId === tour.id}
                  onSelect={() => setSelectedId(tour.id)}
                  listItemRef={(el) => {
                    if (el) itemRefs.current.set(tour.id, el);
                    else itemRefs.current.delete(tour.id);
                  }}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="relative min-h-[300px] flex-1 lg:min-h-0">
          <ToursCatalogMap
            tours={tours}
            selectedId={selectedId}
            onSelect={setSelectedId}
            currency={currency}
            locale={locale}
            className="min-h-[300px] lg:min-h-[640px]"
          />
        </div>
      </div>
    </div>
  );
}
