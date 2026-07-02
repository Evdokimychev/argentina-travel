"use client";

import { useState } from "react";
import type { TourListing } from "@/types";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { cn } from "@/lib/cn";
import SearchBlock from "./SearchBlock";
import HomeFlightSearchBlock from "./HomeFlightSearchBlock";
import HomeExcursionSearchBlock from "./HomeExcursionSearchBlock";
import HomeFlightPopularRoutes from "./HomeFlightPopularRoutes";
import type { ExcursionCity } from "@/types/excursion";

export type HomeSearchTab = "flights" | "tours" | "excursions";

type HomeMultiSearchProps = {
  tours: TourListing[];
  excursionCities: ExcursionCity[];
  query: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  nearMe: boolean;
  onQueryChange: (q: string) => void;
  onDatesChange: (from: Date | null, to: Date | null) => void;
  onNearMe: (coords: { lat: number; lng: number } | null) => void;
  onToursSearch: () => void;
  onTabChange?: (tab: HomeSearchTab) => void;
};

const TAB_ORDER: HomeSearchTab[] = ["tours", "excursions", "flights"];

export default function HomeMultiSearch({
  tours,
  excursionCities,
  query,
  dateFrom,
  dateTo,
  nearMe,
  onQueryChange,
  onDatesChange,
  onNearMe,
  onToursSearch,
  onTabChange,
}: HomeMultiSearchProps) {
  const { t } = useLocaleCurrency();
  const [activeTab, setActiveTab] = useState<HomeSearchTab>("tours");
  const [flightRoutePreset, setFlightRoutePreset] = useState<{
    origin: string;
    destination: string;
  } | null>(null);

  function selectTab(tab: HomeSearchTab) {
    setActiveTab(tab);
    onTabChange?.(tab);
  }

  const tabLabels: Record<HomeSearchTab, string> = {
    flights: t("home.search.tab.flights"),
    tours: t("home.search.tab.tours"),
    excursions: t("home.search.tab.excursions"),
  };

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    tab: HomeSearchTab,
  ) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const index = TAB_ORDER.indexOf(tab);
    const nextIndex =
      event.key === "ArrowRight"
        ? (index + 1) % TAB_ORDER.length
        : (index - 1 + TAB_ORDER.length) % TAB_ORDER.length;
    const nextTab = TAB_ORDER[nextIndex];
    selectTab(nextTab);
    document.getElementById(`home-search-tab-${nextTab}`)?.focus();
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div
        className="scrollbar-hide -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
        role="tablist"
        aria-label={t("home.search.tabsLabel")}
      >
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            id={`home-search-tab-${tab}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`home-search-panel-${tab}`}
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => selectTab(tab)}
            onKeyDown={(event) => handleTabKeyDown(event, tab)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              activeTab === tab
                ? "border-sky-ink bg-sky-ink text-white shadow-sm"
                : "border-gray-200/80 bg-white/90 text-charcoal shadow-sm backdrop-blur-sm hover:border-sky/30 hover:bg-white hover:text-sky-ink",
            )}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      <div
        className="rounded-3xl border border-gray-200/80 bg-white p-3 shadow-lg shadow-charcoal/5 sm:p-4"
        role="tabpanel"
        id={`home-search-panel-${activeTab}`}
        aria-labelledby={`home-search-tab-${activeTab}`}
      >
        {activeTab === "tours" ? (
          <SearchBlock
            embedded
            tours={tours}
            query={query}
            dateFrom={dateFrom}
            dateTo={dateTo}
            nearMe={nearMe}
            onQueryChange={onQueryChange}
            onDatesChange={onDatesChange}
            onNearMe={onNearMe}
            onSearch={onToursSearch}
          />
        ) : null}

        {activeTab === "flights" ? (
          <HomeFlightSearchBlock routePreset={flightRoutePreset} />
        ) : null}

        {activeTab === "excursions" ? (
          <HomeExcursionSearchBlock cities={excursionCities} />
        ) : null}
      </div>

      {activeTab === "flights" ? (
        <HomeFlightPopularRoutes
          onSelect={(route) =>
            setFlightRoutePreset({
              origin: route.origin,
              destination: route.destination,
            })
          }
        />
      ) : null}
    </div>
  );
}
