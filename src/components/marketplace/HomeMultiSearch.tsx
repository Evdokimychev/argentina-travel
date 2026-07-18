"use client";

import dynamic from "next/dynamic";
import { Suspense, use, useState } from "react";
import type { TourListing } from "@/types";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { cn } from "@/lib/cn";
import SearchBlock from "./SearchBlock";
import type { ExcursionCity } from "@/types/excursion";

function SearchPanelSkeleton() {
  return (
    <div
      className="h-20 w-full animate-pulse rounded-2xl bg-surface-muted motion-reduce:animate-none"
      role="status"
      aria-label="Загружаем форму поиска"
    />
  );
}

// Tours are the default tab and stay in the initial bundle. Alternative search
// engines are downloaded only after the visitor asks for them.
const HomeFlightSearchBlock = dynamic(() => import("./HomeFlightSearchBlock"), {
  loading: SearchPanelSkeleton,
});
const HomeExcursionSearchBlock = dynamic(() => import("./HomeExcursionSearchBlock"), {
  loading: SearchPanelSkeleton,
});
const HomeFlightPopularRoutes = dynamic(() => import("./HomeFlightPopularRoutes"), {
  loading: () => null,
});

export type HomeSearchTab = "flights" | "tours" | "excursions";

type HomeMultiSearchProps = {
  tours: TourListing[];
  excursionCities: Promise<ExcursionCity[]>;
  query: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  nearMe: boolean;
  onQueryChange: (q: string) => void;
  onDatesChange: (from: Date | null, to: Date | null) => void;
  onNearMe: (coords: { lat: number; lng: number } | null) => void;
  onToursSearch: () => void;
  onTabChange?: (tab: HomeSearchTab) => void;
  enabledTabs?: HomeSearchTab[];
};

const TAB_ORDER: HomeSearchTab[] = ["tours", "excursions", "flights"];

function HomeExcursionSearchData({
  cities,
}: {
  cities: Promise<ExcursionCity[]>;
}) {
  return <HomeExcursionSearchBlock cities={use(cities)} />;
}

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
  enabledTabs = TAB_ORDER,
}: HomeMultiSearchProps) {
  const { t } = useLocaleCurrency();
  const availableTabs = TAB_ORDER.filter((tab) => enabledTabs.includes(tab));
  const [activeTab, setActiveTab] = useState<HomeSearchTab>(
    () => availableTabs[0] ?? "flights",
  );
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
    const index = availableTabs.indexOf(tab);
    const nextIndex =
      event.key === "ArrowRight"
        ? (index + 1) % availableTabs.length
        : (index - 1 + availableTabs.length) % availableTabs.length;
    const nextTab = availableTabs[nextIndex];
    if (!nextTab) return;
    selectTab(nextTab);
    document.getElementById(`home-search-tab-${nextTab}`)?.focus();
  };

  return (
    <div className="min-w-0 w-full max-w-full space-y-3 sm:space-y-4">
      <div
        className="scrollbar-hide -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
        role="tablist"
        aria-label={t("home.search.tabsLabel")}
      >
        {availableTabs.map((tab) => (
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
        className="min-w-0 w-full max-w-full overflow-x-hidden rounded-3xl border border-gray-200/80 bg-white p-3 shadow-lg shadow-charcoal/5 sm:p-4"
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
          <Suspense fallback={<SearchPanelSkeleton />}>
            <HomeExcursionSearchData cities={excursionCities} />
          </Suspense>
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
