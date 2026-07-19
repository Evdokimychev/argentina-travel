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
import { probeThematicLayerAvailability } from "@/lib/map-thematic-loader";
import type { MapBasemapThemeId } from "@/lib/map-basemap-themes";
import type { MapOverlayLayerId } from "@/lib/map-overlay-layers";
import {
  MAP_MARKER_KIND_LABELS,
  type MapMarkerKind,
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
  const [state, setState] = useState<MapArgentinaUrlState>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [searchDraft, setSearchDraft] = useState(initialState.q);
  const [selected, setSelected] = useState<MapObject | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [layerAvailability, setLayerAvailability] = useState<
    Partial<Record<MapThematicLayerId, boolean>>
  >({});
  const [listOpen, setListOpen] = useState(false);
  const [locationPanelOpen, setLocationPanelOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "error">("idle");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    requestId: number;
  } | null>(null);

  useEffect(() => {
    void probeThematicLayerAvailability().then(setLayerAvailability);
    trackProductEvent("map_opened", { source: "map_page" });
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
    if (nextState.kinds.length === 0) {
      setData({ objects: [], routes: [], totals: {} });
      return;
    }

    const params = new URLSearchParams();
    params.set("kind", serializeMapArgentinaKinds(nextState.kinds));
    if (nextState.city) params.set("city", nextState.city);
    if (nextState.q) params.set("q", nextState.q);

    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/map/objects?${params.toString()}`);
      await assertOkResponse(response);
      const payload = (await response.json()) as MapObjectsPayload;
      setData(payload);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось обновить данные карты";
      setLoadError(message);
    } finally {
      setLoading(false);
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
    return mapObjectsToSuggestions(searchMapObjects(data.objects, needle, 6));
  }, [data.objects, searchDraft]);

  const visibleObjects = useMemo(() => {
    return data.objects.filter((obj) => state.kinds.includes(obj.kind));
  }, [data.objects, state.kinds]);

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

  function ensureKindsForObject(obj: MapObject, kinds: MapMarkerKind[]): MapMarkerKind[] {
    if (kinds.includes(obj.kind)) return kinds;
    return [...kinds, obj.kind];
  }

  function selectMapObject(obj: MapObject, q = "") {
    const nextKinds = ensureKindsForObject(obj, stateRef.current.kinds);
    const nextState: MapArgentinaUrlState = {
      ...stateRef.current,
      kinds: nextKinds,
      q,
      selected: obj.id,
    };
    setSelected(obj);
    applyState(nextState);
  }

  function handleSearchSubmit() {
    const q = searchDraft.trim();
    trackProductEvent("site_search_started", { source: "map", entityType: "map_object" });
    const match = q ? searchMapObjects(data.objects, q, 1)[0] : undefined;
    if (match) {
      trackProductEvent("site_search_completed", { source: "map", entityType: match.kind, entityId: match.id, count: 1 });
      selectMapObject(match, q);
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
      selected: keepSelected ? state.selected : "",
    });
  }

  function handleSelectAllKinds() {
    applyState({ ...state, kinds: selectAllMapFilterKinds() });
  }

  function handleClearAllKinds() {
    applyState({ ...state, kinds: clearAllMapFilterKinds(), selected: "" });
    setSelected(null);
  }

  function handleResetKinds() {
    applyState({ ...state, kinds: resetMapFilterKinds() });
  }

  function handleThemeChange(theme: MapBasemapThemeId) {
    const nextState = { ...state, theme };
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

  function handleSelectSuggestion(id: string) {
    const obj = data.objects.find((item) => item.id === id);
    if (!obj) return;
    setSearchDraft(obj.title);
    selectMapObject(obj, obj.title);
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
    if (obj) handleSelectObject(obj);
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
    <div className="relative h-[calc(100dvh-var(--site-header-full-height,72px))] min-h-[520px] w-full">
      <h1 className="sr-only">Интерактивная карта Аргентины</h1>
      <ArgentinaMapLibreCanvas
        objects={visibleObjects}
        routes={visibleRoutes}
        activeKinds={state.kinds}
        selectedId={mapSelectedId}
        theme={state.theme}
        overlays={state.overlays}
        thematic={state.thematic}
        onSelect={handleSelectObject}
        userLocation={userLocation}
        className="absolute inset-0"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 sm:p-4">
        <div className="pointer-events-auto mx-auto w-full max-w-6xl space-y-2">
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
            onToggleKind={handleToggleKind}
            onSelectAllKinds={handleSelectAllKinds}
            onClearAllKinds={handleClearAllKinds}
            onResetKinds={handleResetKinds}
            loading={loading}
          />
        </div>
      </div>

      <MapThematicLayersControl
        thematic={state.thematic}
        layerAvailability={layerAvailability}
        onToggleThematic={handleToggleThematic}
        onClearThematic={handleClearThematic}
        className="absolute left-2.5 top-[300px] z-20 sm:left-[9px] sm:top-[248px]"
      />

      <MapStyleLayersControl
        theme={state.theme}
        onThemeChange={handleThemeChange}
        overlays={state.overlays}
        onToggleOverlay={handleToggleOverlay}
        className="absolute right-2.5 top-[300px] z-20 sm:right-[9px] sm:top-[248px]"
      />

      <MapObjectPopup
        object={selected}
        onClose={() => handleSelectObject(null)}
        onSelectObjectId={handleSelectObjectById}
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
          className="flex min-h-11 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-charcoal shadow-md hover:bg-gray-50"
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
          className="flex min-h-11 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-charcoal shadow-md hover:bg-gray-50"
        >
          <List className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Показать списком</span>
        </button>
      </div>

      {locationPanelOpen ? (
        <section
          id="map-location-panel"
          aria-label="Использование местоположения"
          className="absolute bottom-28 right-3 z-30 w-[min(calc(100%-1.5rem),22rem)] rounded-md border border-gray-200 bg-white p-4 shadow-lg sm:right-4"
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate hover:bg-gray-100"
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
          className="absolute inset-x-0 bottom-0 z-30 max-h-[65dvh] overflow-y-auto border-t border-gray-200 bg-white shadow-xl sm:bottom-4 sm:left-auto sm:right-4 sm:w-[26rem] sm:rounded-md sm:border"
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
              className="flex h-10 w-10 items-center justify-center rounded-md text-slate hover:bg-gray-100"
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
                      {object.region} · {object.meta ?? MAP_MARKER_KIND_LABELS[object.kind]}
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
