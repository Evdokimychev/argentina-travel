"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import type { PlaceRegionSummary } from "@/lib/places-region-stats";
import { cn } from "@/lib/cn";

type PlacesRegionExplorerProps = {
  regions: PlaceRegionSummary[];
  activeRegion: string;
  onSelect: (region: string) => void;
};

export default function PlacesRegionExplorer({
  regions,
  activeRegion,
  onSelect,
}: PlacesRegionExplorerProps) {
  const { t } = useLocaleCurrency();

  if (regions.length <= 1) return null;

  return (
    <section className="mt-6" aria-label={t("places.regions.title")}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-sm font-bold text-charcoal">{t("places.regions.title")}</h2>
          <p className="mt-0.5 text-xs text-slate">{t("places.regions.subtitle")}</p>
        </div>
        {activeRegion ? (
          <button
            type="button"
            onClick={() => onSelect("")}
            className="shrink-0 text-xs font-medium text-sky hover:underline"
          >
            {t("places.regions.showAll")}
          </button>
        ) : null}
      </div>

      <div className="scrollbar-hide mt-3 flex gap-3 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onSelect("")}
          className={cn(
            "flex w-[140px] shrink-0 flex-col overflow-hidden rounded-2xl border text-left transition-all sm:w-[160px]",
            !activeRegion
              ? "border-sky ring-2 ring-sky/20"
              : "border-gray-100 hover:border-gray-200 hover:shadow-sm",
          )}
        >
          <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-sky/20 to-sky/5">
            <MapPin className="h-8 w-8 text-sky" aria-hidden />
          </div>
          <div className="px-3 py-2.5">
            <p className="text-sm font-semibold text-charcoal">{t("places.regions.all")}</p>
            <p className="text-[11px] text-slate">{t("places.regions.allHint")}</p>
          </div>
        </button>

        {regions.map((item) => {
          const active = activeRegion === item.region;
          return (
            <button
              key={item.region}
              type="button"
              onClick={() => onSelect(item.region)}
              className={cn(
                "group w-[140px] shrink-0 overflow-hidden rounded-2xl border text-left transition-all sm:w-[160px]",
                active
                  ? "border-sky ring-2 ring-sky/20"
                  : "border-gray-100 hover:border-gray-200 hover:shadow-sm",
              )}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                {item.coverImage ? (
                  <Image
                    src={item.coverImage}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="160px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate">
                    <MapPin className="h-6 w-6" aria-hidden />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent" />
                <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-charcoal">
                  {item.count}
                </span>
              </div>
              <div className="px-3 py-2.5">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-charcoal">{item.region}</p>
                {item.highlightName ? (
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-slate">{item.highlightName}</p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
