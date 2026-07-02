"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { MapPin, Route } from "lucide-react";
import MapLayerToggles from "@/components/map/MapLayerToggles";
import MapTourListItem from "@/components/map/MapTourListItem";
import PlaceMapListItem from "@/components/map/PlaceMapListItem";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { formatPriceUsd } from "@/lib/currency";
import type { MapLayerId, MapLayersPayload } from "@/lib/map-types";
import {
  buildMapPath,
  parseMapUrlState,
  toggleMapLayer,
  type MapUrlState,
} from "@/lib/map-url-state";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";
import { ARGENTINA_REGIONS_GEOJSON } from "@/data/argentina-regions";
import type { MapRegionFeatureProperties } from "@/lib/map-types";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { assertOkResponse } from "@/lib/site-feedback/parse-api-error";

const ArgentinaMapCanvas = dynamic(() => import("@/components/map/ArgentinaMapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[280px] items-center justify-center bg-gray-50 text-sm text-slate">
      Загрузка карты…
    </div>
  ),
});

interface ArgentinaMapHubProps {
  initialData: MapLayersPayload;
  initialState: MapUrlState;
}

function getPrimaryLayer(layers: MapLayerId[]): MapLayerId {
  const order: MapLayerId[] = ["tours", "places", "routes", "regions"];
  return order.find((layer) => layers.includes(layer)) ?? "tours";
}

export default function ArgentinaMapHub({ initialData, initialState }: ArgentinaMapHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency, locale } = useLocaleCurrency();

  const [data, setData] = useState(initialData);
  const [state, setState] = useState<MapUrlState>(initialState);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(
    initialData.tours[0]?.id ?? null
  );
  const [selectedPlaceSlug, setSelectedPlaceSlug] = useState<string | null>(
    initialData.places[0]?.slug ?? null
  );
  const [selectedRouteSlug, setSelectedRouteSlug] = useState<string | null>(
    initialData.routes[0]?.slug ?? null
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  useEffect(() => {
    const nextState = parseMapUrlState(searchParams);
    setState(nextState);
  }, [searchParams]);

  const replaceUrl = useCallback(
    (nextState: MapUrlState) => {
      router.replace(buildMapPath(nextState), { scroll: false });
    },
    [router]
  );

  const refreshData = useCallback(async (nextState: MapUrlState) => {
    const params = new URLSearchParams();
    params.set("layer", nextState.layers.join(","));
    if (nextState.city) params.set("city", nextState.city);
    if (nextState.category) params.set("category", nextState.category);

    try {
      setLoadError(null);
      const response = await fetch(`/api/map/layers?${params.toString()}`);
      await assertOkResponse(response);
      const payload = (await response.json()) as MapLayersPayload;
      setData(payload);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось обновить данные карты";
      setLoadError(message);
    }
  }, []);

  const applyState = useCallback(
    (nextState: MapUrlState) => {
      setState(nextState);
      replaceUrl(nextState);
      void refreshData(nextState);
    },
    [replaceUrl, refreshData]
  );

  const handleToggleLayer = (layer: MapLayerId) => {
    applyState({ ...state, layers: toggleMapLayer(state.layers, layer) });
  };

  const primaryLayer = useMemo(() => getPrimaryLayer(state.layers), [state.layers]);

  const regionItems = useMemo(
    () =>
      (ARGENTINA_REGIONS_GEOJSON.features ?? []).map((feature) => ({
        id: (feature.properties as MapRegionFeatureProperties).id,
        nameRu: (feature.properties as MapRegionFeatureProperties).nameRu,
        macroRegionRu: (feature.properties as MapRegionFeatureProperties).macroRegionRu,
      })),
    []
  );

  const listCount = useMemo(() => {
    if (primaryLayer === "tours") return data.tours.length;
    if (primaryLayer === "places") return data.places.length;
    if (primaryLayer === "routes") return data.routes.length;
    return regionItems.length;
  }, [primaryLayer, data, regionItems.length]);

  useEffect(() => {
    const scrollKey =
      primaryLayer === "tours"
        ? selectedTourId
        : primaryLayer === "places"
          ? selectedPlaceSlug
          : primaryLayer === "routes"
            ? selectedRouteSlug
            : null;
    if (!scrollKey) return;
    itemRefs.current.get(scrollKey)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedTourId, selectedPlaceSlug, selectedRouteSlug, primaryLayer]);

  const formatTourPrice = useCallback(
    (priceUsd: number) => formatPriceUsd(priceUsd, currency, locale),
    [currency, locale]
  );

  const listHeader = useMemo(() => {
    switch (primaryLayer) {
      case "places":
        return "Места на карте";
      case "routes":
        return "Маршруты туров";
      case "regions":
        return "Провинции и регионы";
      default:
        return "Туры на карте";
    }
  }, [primaryLayer]);

  return (
    <div className="pb-16">
      <section className="border-b border-gray-100 bg-gradient-to-b from-sky/[0.06] via-white to-white">
        <div className={cn(siteContainerClass, "py-8 sm:py-10")}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky">Карта страны</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-charcoal sm:text-4xl">
            Карта Аргентины
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate">
            Туры, места, провинции и маршруты на одной интерактивной карте. Переключайте слои и
            выбирайте объект в списке или на карте.
          </p>

          {loadError ? (
            <InlineFeedback
              variant="error"
              title="Не удалось обновить данные"
              description={loadError}
              steps={["Проверьте интернет", "Измените фильтры или обновите страницу"]}
              action={{
                label: "Повторить",
                onClick: () => void refreshData(state),
              }}
              className="mt-4"
            />
          ) : null}

          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <MapLayerToggles activeLayers={state.layers} onToggle={handleToggleLayer} />
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2 text-slate">
                <span>Город</span>
                <input
                  type="search"
                  value={state.city}
                  onChange={(event) =>
                    applyState({ ...state, city: event.target.value.trimStart() })
                  }
                  placeholder="Буэнос-Айрес"
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-charcoal"
                />
              </label>
              {state.layers.includes("places") ? (
                <label className="flex items-center gap-2 text-slate">
                  <span>Категория</span>
                  <input
                    type="search"
                    value={state.category}
                    onChange={(event) =>
                      applyState({ ...state, category: event.target.value.trimStart() })
                    }
                    placeholder="glacier"
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-charcoal"
                  />
                </label>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className={cn(siteContainerClass, "mt-6")}>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex min-h-[560px] flex-col lg:min-h-[680px] lg:flex-row">
            <div className="order-2 flex flex-col border-t border-gray-100 lg:order-1 lg:w-[42%] lg:border-r lg:border-t-0">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-charcoal">{listHeader}</p>
                <p className="mt-0.5 text-xs text-slate">
                  {listCount}{" "}
                  {primaryLayer === "regions"
                    ? "регионов"
                    : primaryLayer === "places"
                      ? "мест"
                      : primaryLayer === "routes"
                        ? "маршрутов"
                        : "туров"}
                </p>
              </div>

              <ul className="max-h-[320px] overflow-y-auto lg:max-h-none lg:flex-1">
                {primaryLayer === "tours" &&
                  data.tours.map((tour) => (
                    <MapTourListItem
                      key={tour.id}
                      tour={tour}
                      selected={selectedTourId === tour.id}
                      onSelect={() => setSelectedTourId(tour.id)}
                      listItemRef={(el) => {
                        if (el) itemRefs.current.set(tour.id, el);
                        else itemRefs.current.delete(tour.id);
                      }}
                    />
                  ))}

                {primaryLayer === "places" &&
                  data.places.map((place) => (
                    <PlaceMapListItem
                      key={place.slug}
                      place={place}
                      selected={selectedPlaceSlug === place.slug}
                      onSelect={() => setSelectedPlaceSlug(place.slug)}
                      listItemRef={(el) => {
                        if (el) itemRefs.current.set(place.slug, el);
                        else itemRefs.current.delete(place.slug);
                      }}
                    />
                  ))}

                {primaryLayer === "routes" &&
                  data.routes.map((route) => (
                    <li
                      key={route.slug}
                      ref={(el) => {
                        if (el) itemRefs.current.set(route.slug, el);
                        else itemRefs.current.delete(route.slug);
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedRouteSlug(route.slug)}
                        className={cn(
                          "flex w-full items-start gap-3 border-b border-gray-100 p-4 text-left transition-colors last:border-b-0",
                          selectedRouteSlug === route.slug
                            ? "bg-brand-light/40 ring-1 ring-sky/20"
                            : "hover:bg-gray-50/80"
                        )}
                      >
                        <Route className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
                        <span>
                          <span className="block text-sm font-semibold text-charcoal">
                            {route.title}
                          </span>
                          <span className="mt-1 block text-xs text-slate">
                            {route.points.length} точек
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}

                {primaryLayer === "regions" &&
                  regionItems.map((region) => (
                    <li key={region.id}>
                      <button
                        type="button"
                        onClick={() =>
                          applyState({ ...state, highlight: region.id, layers: ["regions"] })
                        }
                        className={cn(
                          "flex w-full items-start gap-3 border-b border-gray-100 p-4 text-left transition-colors last:border-b-0",
                          state.highlight === region.id
                            ? "bg-brand-light/40 ring-1 ring-sky/20"
                            : "hover:bg-gray-50/80"
                        )}
                      >
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
                        <span>
                          <span className="block text-sm font-semibold text-charcoal">
                            {region.nameRu}
                          </span>
                          {region.macroRegionRu ? (
                            <span className="mt-1 block text-xs text-slate">
                              {region.macroRegionRu}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  ))}

                {listCount === 0 ? (
                  <li className="p-8 text-center text-sm text-slate">
                    Нет объектов для выбранных фильтров
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="relative order-1 min-h-[320px] flex-1 lg:order-2 lg:min-h-0">
              <ArgentinaMapCanvas
                layers={state.layers}
                tours={data.tours}
                places={data.places}
                routes={data.routes}
                selectedTourId={selectedTourId}
                selectedPlaceSlug={selectedPlaceSlug}
                selectedRouteSlug={selectedRouteSlug}
                highlightRegion={state.highlight}
                onSelectTour={setSelectedTourId}
                onSelectPlace={setSelectedPlaceSlug}
                onSelectRoute={setSelectedRouteSlug}
                formatTourPrice={formatTourPrice}
                className="min-h-[320px] lg:min-h-[680px]"
              />
            </div>
          </div>
        </div>

        {state.highlight ? (
          <p className="mt-3 text-sm text-slate">
            Подсветка региона:{" "}
            <strong className="text-charcoal">{state.highlight}</strong>.{" "}
            <Link href="/tours" className="font-medium text-sky hover:underline">
              Открыть каталог туров
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
