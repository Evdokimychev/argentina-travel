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
import type { MapMarkerKind, MapObject, MapObjectsPayload } from "@/lib/map-types";

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

  useEffect(() => {
    void probeThematicLayerAvailability().then(setLayerAvailability);
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
    if (!selected) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        replaceUrl({ ...stateRef.current, selected: "" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, replaceUrl]);

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
    const match = q ? searchMapObjects(data.objects, q, 1)[0] : undefined;
    if (match) {
      selectMapObject(match, q);
      return;
    }
    applyState({ ...state, q, selected: "" });
    setSelected(null);
  }

  function handleSearchClear() {
    setSearchDraft("");
    applyState({ ...state, q: "", selected: "" });
    setSelected(null);
  }

  function handleToggleKind(kind: MapMarkerKind) {
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
    replaceUrl({ ...state, selected: obj?.id ?? "" });
  }

  function handleSelectObjectById(id: string) {
    const obj = data.objects.find((item) => item.id === id) ?? null;
    if (obj) handleSelectObject(obj);
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
      <ArgentinaMapLibreCanvas
        objects={visibleObjects}
        routes={visibleRoutes}
        activeKinds={state.kinds}
        selectedId={mapSelectedId}
        theme={state.theme}
        overlays={state.overlays}
        thematic={state.thematic}
        onSelect={handleSelectObject}
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
        className="absolute left-2.5 top-[248px] z-20 sm:left-[9px]"
      />

      <MapStyleLayersControl
        theme={state.theme}
        onThemeChange={handleThemeChange}
        overlays={state.overlays}
        onToggleOverlay={handleToggleOverlay}
        className="absolute right-2.5 top-[248px] z-20 sm:right-[9px]"
      />

      <MapObjectPopup
        object={selected}
        onClose={() => handleSelectObject(null)}
        onSelectObjectId={handleSelectObjectById}
      />

      <p className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg bg-white/75 px-2 py-1 text-[10px] text-slate backdrop-blur-sm sm:left-4">
        {attribution}
      </p>
    </div>
  );
}
