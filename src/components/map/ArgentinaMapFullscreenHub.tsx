"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ArgentinaMapLibreCanvas from "@/components/map/ArgentinaMapLibreCanvas";
import MapControlsPanel from "@/components/map/MapControlsPanel";
import MapStyleLayersControl from "@/components/map/MapStyleLayersControl";
import MapThematicLayersControl from "@/components/map/MapThematicLayersControl";
import { useRouter, useSearchParams } from "next/navigation";
import MapObjectPopup from "@/components/map/MapObjectPopup";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { assertOkResponse } from "@/lib/site-feedback/parse-api-error";
import { MAP_BASEMAP_THEMES } from "@/lib/map-basemap-themes";
import {
  buildMapArgentinaPath,
  clearAllMapFilterKinds,
  parseMapArgentinaUrlState,
  resetMapFilterKinds,
  selectAllMapFilterKinds,
  serializeMapArgentinaKinds,
  toggleMapArgentinaKind,
  type MapArgentinaUrlState,
} from "@/lib/map-argentina-url-state";
import { collectMapOverlayAttributions, toggleMapOverlayLayer } from "@/lib/map-overlay-layers";
import {
  DEFAULT_MAP_THEMATIC_STATE,
  toggleMapThematicLayer,
  type MapThematicLayerId,
} from "@/lib/map-thematic-layers";
import { mapObjectsToSuggestions, searchMapObjects } from "@/lib/map-search";
import {
  DEFAULT_MAP_DISCOVERY_MODE,
  findNearbyMapObjects,
  MAP_DISCOVERY_MODE_KINDS,
  matchesMapDiscoveryMode,
} from "@/lib/map-discovery";
import { probeThematicLayerAvailability } from "@/lib/map-thematic-loader";
import type { MapBasemapThemeId } from "@/lib/map-basemap-themes";
import type { MapOverlayLayerId } from "@/lib/map-overlay-layers";
import {
  formatMapObjectListSubtitle,
  type MapMarkerKind,
  type MapDiscoveryMode,
  type MapObject,
  type MapObjectsPayload,
} from "@/lib/map-types";
import { trackProductEvent } from "@/lib/analytics/product-events";
import { List, Loader2, LocateFixed, X } from "lucide-react";

type Props = {
  initialData: MapObjectsPayload;
  initialState: MapArgentinaUrlState;
};

export default function ArgentinaMapFullscreenHub({ initialData, initialState }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState(initialData);
  const [searchObjects, setSearchObjects] = useState(initialData.objects);
  const [state, setState] = useState<MapArgentinaUrlState>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [searchDraft, setSearchDraft] = useState(initialState.q);
  const [selected, setSelected] = useState<MapObject | null>(null);
  const [selectedFlightDestinationIata, setSelectedFlightDestinationIata] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [layerAvailability, setLayerAvailability] = useState<
    Partial<Record<MapThematicLayerId, boolean>>
  >({});
  const [loadingThematicLayers, setLoadingThematicLayers] = useState<MapThematicLayerId[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [locationPanelOpen, setLocationPanelOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "error">("idle");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    requestId: number;
  } | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const requestSequenceRef = useRef(0);
  const searchControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    void probeThematicLayerAvailability().then(setLayerAvailability);
    trackProductEvent("map_opened", { source: "map_page" });
    return () => {
      requestControllerRef.current?.abort();
      searchControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const next = parseMapArgentinaUrlState(searchParams);
    setState(next);
    setSearchDraft(next.q);
  }, [searchParams]);

  useEffect(() => {
    if (!state.selected) {
      setSelected(null);
      return;
    }
    const obj = data.objects.find((item) => item.id === state.selected) ?? null;
    setSelected(obj);
  }, [state.selected, data.objects]);

  useEffect(() => {
    setSelectedFlightDestinationIata(null);
  }, [selected?.id]);

  const replaceUrl = useCallback(
    (nextState: MapArgentinaUrlState) => {
      router.replace(buildMapArgentinaPath(nextState), { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    if (!selected && !listOpen && !locationPanelOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setListOpen(false);
        setLocationPanelOpen(false);
        if (selected) {
          setSelected(null);
          replaceUrl({ ...stateRef.current, selected: "" });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, listOpen, locationPanelOpen, replaceUrl]);

  const refreshData = useCallback(async (nextState: MapArgentinaUrlState) => {
    requestControllerRef.current?.abort();
    if (nextState.kinds.length === 0) {
      setData({ objects: [], routes: [], totals: {} });
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    requestControllerRef.current = controller;
    const requestSequence = ++requestSequenceRef.current;

    const params = new URLSearchParams();
    params.set("kind", serializeMapArgentinaKinds(nextState.kinds));
    if (nextState.city) params.set("city", nextState.city);
    if (nextState.q) params.set("q", nextState.q);

    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/map/objects?${params.toString()}`, {
        signal: controller.signal,
      });
      await assertOkResponse(response);
      const payload = (await response.json()) as MapObjectsPayload;
      setData(payload);
      setSearchObjects((current) => {
        const merged = new Map(current.map((object) => [object.id, object]));
        for (const object of payload.objects) merged.set(object.id, object);
        return [...merged.values()];
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      const message =
        error instanceof Error ? error.message : "Не удалось обновить данные карты";
      setLoadError(message);
    } finally {
      if (requestSequence === requestSequenceRef.current) {
        setLoading(false);
        requestControllerRef.current = null;
      }
    }
  }, []);

  const applyState = useCallback(
    (nextState: MapArgentinaUrlState) => {
      setState(nextState);
      replaceUrl(nextState);
      void refreshData(nextState);
    },
    [replaceUrl, refreshData]
  );

  const suggestions = useMemo(() => {
    const needle = searchDraft.trim();
    if (!needle) return [];
    return mapObjectsToSuggestions(searchMapObjects(searchObjects, needle, 6));
  }, [searchObjects, searchDraft]);

  useEffect(() => {
    const query = searchDraft.trim();
    if (query.length < 2 || searchMapObjects(searchObjects, query, 1).length > 0) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchControllerRef.current?.abort();
      searchControllerRef.current = controller;
      const params = new URLSearchParams({
        kind: "city,national_park,attraction,tour,airport,transport",
        q: query,
        limit: "12",
      });
      void fetch(`/api/map/objects?${params.toString()}`, { signal: controller.signal })
        .then(async (response) => {
          await assertOkResponse(response);
          return response.json() as Promise<MapObjectsPayload>;
        })
        .then((payload) => {
          setSearchObjects((current) => {
            const merged = new Map(current.map((object) => [object.id, object]));
            for (const object of payload.objects) merged.set(object.id, object);
            return [...merged.values()];
          });
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchDraft, searchObjects]);

  const visibleObjects = useMemo(() => {
    return data.objects.filter((obj) => matchesMapDiscoveryMode(obj, state.focus));
  }, [data.objects, state.focus]);

  const visibleRoutes = state.kinds.includes("route") ? data.routes : [];
  const visibleItemCount = visibleObjects.length + visibleRoutes.length;

  const mapSelectedId = useMemo(() => {
    if (selected?.id && visibleObjects.some((obj) => obj.id === selected.id)) {
      return selected.id;
    }
    if (state.selected && visibleObjects.some((obj) => obj.id === state.selected)) {
      return state.selected;
    }
    return null;
  }, [selected, state.selected, visibleObjects]);

  const nearbyObjects = useMemo(
    () => findNearbyMapObjects(selected, data.objects, { limit: 6, maxDistanceKm: 120 }),
    [selected, data.objects],
  );

  function ensureKindsForObject(obj: MapObject, kinds: MapMarkerKind[]): MapMarkerKind[] {
    if (kinds.includes(obj.kind)) return kinds;
    return [...kinds, obj.kind];
  }

  function selectMapObject(obj: MapObject, q = "") {
    const nextKinds = ensureKindsForObject(obj, stateRef.current.kinds);
    const nextFocus = matchesMapDiscoveryMode(obj, stateRef.current.focus)
      ? stateRef.current.focus
      : "all";
    const nextState: MapArgentinaUrlState = {
      ...stateRef.current,
      kinds: nextKinds,
      focus: nextFocus,
      q,
      selected: obj.id,
    };
    setSelected(obj);
    applyState(nextState);
  }

  function handleSearchSubmit() {
    const q = searchDraft.trim();
    trackProductEvent("site_search_started", { source: "map", entityType: "map_object" });
    const match = q ? searchMapObjects(searchObjects, q, 1)[0] : undefined;
    if (match) {
      trackProductEvent("site_search_completed", { source: "map", entityType: match.kind, entityId: match.id, count: 1 });
      selectMapObject(match);
      return;
    }
    trackProductEvent("site_search_zero_results", { source: "map", entityType: "map_object", count: 0 });
    applyState({ ...state, q, selected: "" });
    setSelected(null);
  }

  function handleSearchClear() {
    setSearchDraft("");
    applyState({ ...state, q: "", selected: "" });
    setSelected(null);
  }

  function handleToggleKind(kind: MapMarkerKind) {
    trackProductEvent("map_filter_changed", { source: "category", entityType: "map_kind", entityId: kind });
    const nextKinds = toggleMapArgentinaKind(state.kinds, kind);
    const keepSelected =
      state.selected &&
      data.objects.some((obj) => obj.id === state.selected && nextKinds.includes(obj.kind));
    if (!keepSelected) {
      setSelected(null);
    }
    applyState({
      ...state,
      kinds: nextKinds,
      focus: "all",
      selected: keepSelected ? state.selected : "",
    });
  }

  function handleSelectAllKinds() {
    applyState({ ...state, kinds: selectAllMapFilterKinds(), focus: "all" });
  }

  function handleClearAllKinds() {
    applyState({ ...state, kinds: clearAllMapFilterKinds(), selected: "", focus: "all" });
    setSelected(null);
  }

  function handleResetKinds() {
    applyState({ ...state, kinds: resetMapFilterKinds(), focus: DEFAULT_MAP_DISCOVERY_MODE });
  }

  function handleDiscoveryModeChange(focus: MapDiscoveryMode) {
    trackProductEvent("map_filter_changed", {
      source: "discovery_mode",
      entityType: "map_focus",
      entityId: focus,
    });
    applyState({
      ...state,
      kinds: [...MAP_DISCOVERY_MODE_KINDS[focus]],
      focus,
      selected: "",
    });
    setSelected(null);
  }

  function handleThemeChange(theme: MapBasemapThemeId) {
    const nextState = {
      ...state,
      theme,
      overlays:
        theme === "satellite" && !state.overlays.labels
          ? { ...state.overlays, labels: true }
          : state.overlays,
    };
    setState(nextState);
    replaceUrl(nextState);
  }

  function handleActivateTerrainPreset() {
    const nextState = {
      ...state,
      theme: "nature" as const,
      overlays: {
        ...state.overlays,
        hillshade: true,
        contours: false,
      },
    };
    setState(nextState);
    replaceUrl(nextState);
  }

  function handleToggleOverlay(layerId: MapOverlayLayerId) {
    const nextState = {
      ...state,
      overlays: toggleMapOverlayLayer(state.overlays, layerId),
    };
    setState(nextState);
    replaceUrl(nextState);
  }

  function handleToggleThematic(layerId: MapThematicLayerId) {
    if (layerAvailability[layerId] !== true) return;
    const nextState = {
      ...state,
      thematic: toggleMapThematicLayer(state.thematic, layerId),
    };
    setState(nextState);
    replaceUrl(nextState);
  }

  function handleClearThematic() {
    const nextState = { ...state, thematic: { ...DEFAULT_MAP_THEMATIC_STATE } };
    setState(nextState);
    replaceUrl(nextState);
  }

  const handleThematicLayerLoadState = useCallback(
    (layerId: MapThematicLayerId, isLoading: boolean) => {
      setLoadingThematicLayers((current) =>
        isLoading
          ? current.includes(layerId)
            ? current
            : [...current, layerId]
          : current.filter((id) => id !== layerId),
      );
    },
    [],
  );

  function handleSelectSuggestion(id: string) {
    const obj = searchObjects.find((item) => item.id === id);
    if (!obj) return;
    setSearchDraft(obj.title);
    selectMapObject(obj);
  }

  function handleSelectObject(obj: MapObject | null) {
    setSelected(obj);
    if (obj) {
      trackProductEvent(obj.kind === "airport" ? "airport_selected" : "map_marker_selected", {
        entityType: obj.kind,
        entityId: obj.id,
        source: "map_marker",
      });
    }
    replaceUrl({ ...state, selected: obj?.id ?? "" });
  }

  function handleSelectObjectById(id: string) {
    const obj = data.objects.find((item) => item.id === id) ?? null;
    if (obj) selectMapObject(obj);
  }

  function navigateFromMapObject(href: string) {
    setSelected(null);
    setSelectedFlightDestinationIata(null);
    window.setTimeout(() => {
      if (/^https?:\/\//i.test(href)) window.location.assign(href);
      else router.push(href);
    }, 0);
  }

  function requestCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          requestId: Date.now(),
        });
        setLocationStatus("idle");
        setLocationPanelOpen(false);
      },
      () => setLocationStatus("error"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  const attribution = [
    MAP_BASEMAP_THEMES[state.theme].attribution,
    ...collectMapOverlayAttributions(state.overlays),
  ].join(" · ");

  const emptyFeedback =
    !loading && !loadError && visibleItemCount === 0
      ? state.kinds.length === 0
        ? {
            title: "Метки на карте скрыты",
            description: "Включите нужные категории или верните стандартный набор меток.",
            action: { label: "Вернуть фильтры", onClick: handleResetKinds },
          }
        : state.q
          ? {
              title: "Поиск ничего не нашёл",
              description: `По запросу «${state.q}» нет объектов на карте. Попробуйте другое слово или очистите поиск.`,
              action: { label: "Очистить поиск", onClick: handleSearchClear },
            }
          : {
              title: "Нет объектов по выбранным фильтрам",
              description: "Измените категории на карте или верните стандартный набор меток.",
              action: { label: "Вернуть фильтры", onClick: handleResetKinds },
            }
      : null;

  return (
    <div className="relative h-[calc(100dvh-var(--site-header-full-height,72px)-var(--public-mobile-nav-height,0px))] min-h-[320px] w-full md:h-[calc(100dvh-var(--site-header-full-height,72px))] md:min-h-[520px]">
      <ArgentinaMapLibreCanvas
        objects={visibleObjects}
        routes={visibleRoutes}
        activeKinds={state.kinds}
        selectedId={mapSelectedId}
        theme={state.theme}
        overlays={state.overlays}
        thematic={state.thematic}
        onThematicLayerLoadState={handleThematicLayerLoadState}
        onSelect={handleSelectObject}
        selectedFlightDestinationIata={selectedFlightDestinationIata}
        onSelectFlightDestination={setSelectedFlightDestinationIata}
        userLocation={userLocation}
        className="absolute inset-0"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-2 md:p-4">
        <div className="pointer-events-auto mx-auto w-full max-w-6xl space-y-2">
          <MapControlsPanel
            objectCount={visibleItemCount}
            searchDraft={searchDraft}
            activeQuery={state.q}
            onSearchChange={setSearchDraft}
            onSearchSubmit={handleSearchSubmit}
            onSearchClear={handleSearchClear}
            suggestions={suggestions}
            onSelectSuggestion={handleSelectSuggestion}
            activeKinds={state.kinds}
            discoveryMode={state.focus}
            onDiscoveryModeChange={handleDiscoveryModeChange}
            onToggleKind={handleToggleKind}
            onSelectAllKinds={handleSelectAllKinds}
            onClearAllKinds={handleClearAllKinds}
            onResetKinds={handleResetKinds}
            loading={loading}
          />
          {loadError ? (
            <InlineFeedback
              variant="error"
              title="Не удалось обновить карту"
              description={loadError}
              steps={["Проверьте интернет", "Попробуйте изменить фильтры или обновить страницу"]}
              action={{
                label: "Повторить",
                onClick: () => void refreshData(stateRef.current),
              }}
            />
          ) : null}
          {emptyFeedback ? (
            <InlineFeedback
              variant="info"
              title={emptyFeedback.title}
              description={emptyFeedback.description}
              action={emptyFeedback.action}
            />
          ) : null}
        </div>
      </div>

      {loading ? (
        <div
          className="pointer-events-none absolute bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-full border border-sky/15 bg-white/95 px-4 py-2.5 shadow-elevated backdrop-blur-md"
          role="status"
          aria-live="polite"
        >
          <span className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-charcoal">
            <Loader2 className="h-4 w-4 animate-spin text-sky" aria-hidden />
            Обновляем точки — прежние остаются на карте
          </span>
        </div>
      ) : null}

      <MapThematicLayersControl
        thematic={state.thematic}
        layerAvailability={layerAvailability}
        loadingLayerIds={loadingThematicLayers}
        onToggleThematic={handleToggleThematic}
        onClearThematic={handleClearThematic}
        className="absolute left-2 top-[72px] z-30 [&>button]:!h-11 [&>button]:!w-11 md:left-[9px] md:top-[176px]"
      />

      <MapStyleLayersControl
        theme={state.theme}
        onThemeChange={handleThemeChange}
        overlays={state.overlays}
        onToggleOverlay={handleToggleOverlay}
        onActivateTerrainPreset={handleActivateTerrainPreset}
        className="absolute right-2 top-[72px] z-30 [&>button]:!h-11 [&>button]:!w-11 md:right-[9px] md:top-[176px]"
      />

      <MapObjectPopup
        object={selected}
        nearbyObjects={nearbyObjects}
        onClose={() => handleSelectObject(null)}
        onSelectObjectId={handleSelectObjectById}
        selectedFlightDestinationIata={selectedFlightDestinationIata}
        onSelectFlightDestination={setSelectedFlightDestinationIata}
        onNavigate={navigateFromMapObject}
      />

      <div className="absolute bottom-12 right-3 z-20 flex flex-col gap-2 sm:right-4">
        <button
          type="button"
          onClick={() => {
            setListOpen(false);
            setLocationStatus("idle");
            setLocationPanelOpen((open) => !open);
          }}
          aria-expanded={locationPanelOpen}
          aria-controls="map-location-panel"
          aria-label="Моё местоположение"
          title="Моё местоположение"
          className="flex h-11 w-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-charcoal shadow-md hover:bg-gray-50 sm:w-auto sm:px-3"
        >
          <LocateFixed className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Моё местоположение</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setLocationPanelOpen(false);
            setListOpen((open) => !open);
          }}
          aria-pressed={listOpen}
          aria-controls="map-accessible-list"
          aria-label="Показать объекты списком"
          title="Показать объекты списком"
          className="flex h-11 w-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-charcoal shadow-md hover:bg-gray-50 sm:w-auto sm:px-3"
        >
          <List className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Показать списком</span>
        </button>
      </div>

      {locationPanelOpen ? (
        <section
          id="map-location-panel"
          aria-label="Использование местоположения"
          className="absolute inset-x-3 bottom-24 z-30 max-h-[calc(100%-5rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-lg sm:inset-x-auto sm:bottom-28 sm:right-4 sm:w-[22rem] sm:rounded-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-charcoal">Показать, где вы находитесь?</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate">
                Координаты используются только в этой вкладке, чтобы приблизить карту. Мы их не сохраняем и не отправляем в профиль.
              </p>
              <p className="mt-2 text-xs text-slate">Можно отказаться и найти город через поиск вверху.</p>
            </div>
            <button
              type="button"
              onClick={() => setLocationPanelOpen(false)}
              aria-label="Закрыть"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate hover:bg-gray-100"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          {locationStatus === "error" ? (
            <p role="alert" className="mt-3 text-sm text-danger">
              Не удалось получить координаты. Проверьте разрешение браузера или воспользуйтесь поиском.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={requestCurrentLocation}
              disabled={locationStatus === "requesting"}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {locationStatus === "requesting" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <LocateFixed className="h-4 w-4" aria-hidden />
              )}
              {locationStatus === "requesting" ? "Определяем…" : "Показать на карте"}
            </button>
            <button
              type="button"
              onClick={() => setLocationPanelOpen(false)}
              className="min-h-11 rounded-md border border-gray-200 px-4 text-sm font-medium text-charcoal hover:bg-gray-50"
            >
              Не сейчас
            </button>
          </div>
        </section>
      ) : null}

      {listOpen ? (
        <section
          id="map-accessible-list"
          aria-label="Объекты карты списком"
          className="absolute inset-x-0 bottom-0 z-30 max-h-[calc(100%-4.5rem)] overflow-y-auto overscroll-contain rounded-t-3xl border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-xl sm:bottom-4 sm:left-auto sm:right-4 sm:max-h-[65dvh] sm:w-[26rem] sm:rounded-md sm:border sm:pb-0"
        >
          <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-charcoal">Объекты на карте</h2>
              <p className="text-xs text-slate">{visibleObjects.length} по выбранным фильтрам</p>
            </div>
            <button
              type="button"
              onClick={() => setListOpen(false)}
              aria-label="Закрыть список"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-slate hover:bg-gray-100"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          {visibleObjects.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {visibleObjects.map((object) => (
                <li key={object.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setListOpen(false);
                      handleSelectObject(object);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/30"
                  >
                    <span className="block text-sm font-semibold text-charcoal">{object.title}</span>
                    <span className="mt-0.5 block text-xs text-slate">
                      {formatMapObjectListSubtitle(object)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-sm text-slate">По выбранным фильтрам объектов нет.</p>
          )}
        </section>
      ) : null}

      <p className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg bg-white/75 px-2 py-1 text-[10px] text-slate backdrop-blur-sm sm:left-4">
        {attribution}
      </p>
    </div>
  );
}
