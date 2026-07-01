"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import MapControlsPanel from "@/components/map/MapControlsPanel";
import MapObjectPopup from "@/components/map/MapObjectPopup";
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
import type { MapBasemapThemeId } from "@/lib/map-basemap-themes";
import type { MapMarkerKind, MapObject, MapObjectsPayload } from "@/lib/map-types";

const ArgentinaMapLibreCanvas = dynamic(
  () => import("@/components/map/ArgentinaMapLibreCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#e8eef4] text-sm text-slate">
        Загрузка карты…
      </div>
    ),
  }
);

type Props = {
  initialData: MapObjectsPayload;
  initialState: MapArgentinaUrlState;
};

export default function ArgentinaMapFullscreenHub({ initialData, initialState }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState(initialData);
  const [state, setState] = useState<MapArgentinaUrlState>(initialState);
  const [searchDraft, setSearchDraft] = useState(initialState.q);
  const [selected, setSelected] = useState<MapObject | null>(null);
  const [loading, setLoading] = useState(false);

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
    try {
      const response = await fetch(`/api/map/objects?${params.toString()}`);
      if (!response.ok) return;
      const payload = (await response.json()) as MapObjectsPayload;
      setData(payload);
    } catch {
      // keep previous
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
    const needle = searchDraft.trim().toLowerCase();
    if (!needle) return [];
    return data.objects
      .filter((obj) => obj.title.toLowerCase().includes(needle))
      .slice(0, 6)
      .map((obj) => obj.title);
  }, [data.objects, searchDraft]);

  const visibleObjects = useMemo(() => {
    return data.objects.filter((obj) => state.kinds.includes(obj.kind));
  }, [data.objects, state.kinds]);

  const visibleRoutes = state.kinds.includes("route") ? data.routes : [];

  function handleSearchSubmit() {
    const q = searchDraft.trim();
    const match = q
      ? data.objects.find((obj) =>
          `${obj.title} ${obj.meta ?? ""}`.toLowerCase().includes(q.toLowerCase())
        )
      : undefined;
    const nextState: MapArgentinaUrlState = {
      ...state,
      q,
      selected: match?.id ?? "",
    };
    applyState(nextState);
    if (match) setSelected(match);
  }

  function handleSearchClear() {
    setSearchDraft("");
    applyState({ ...state, q: "", selected: "" });
    setSelected(null);
  }

  function handleToggleKind(kind: MapMarkerKind) {
    applyState({ ...state, kinds: toggleMapArgentinaKind(state.kinds, kind) });
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

  function handleSelectObject(obj: MapObject | null) {
    setSelected(obj);
    replaceUrl({ ...state, selected: obj?.id ?? "" });
  }

  const attribution = MAP_BASEMAP_THEMES[state.theme].attribution;

  return (
    <div className="relative h-[calc(100dvh-var(--site-header-full-height,72px))] min-h-[520px] w-full">
      <ArgentinaMapLibreCanvas
        objects={visibleObjects}
        routes={visibleRoutes}
        activeKinds={state.kinds}
        selectedId={selected?.id ?? (state.selected || null)}
        theme={state.theme}
        onSelect={handleSelectObject}
        className="absolute inset-0"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 sm:p-4">
        <div className="pointer-events-auto mx-auto w-full max-w-6xl">
          <MapControlsPanel
            objectCount={visibleObjects.length}
            searchDraft={searchDraft}
            activeQuery={state.q}
            onSearchChange={setSearchDraft}
            onSearchSubmit={handleSearchSubmit}
            onSearchClear={handleSearchClear}
            suggestions={suggestions}
            activeKinds={state.kinds}
            onToggleKind={handleToggleKind}
            onSelectAllKinds={handleSelectAllKinds}
            onClearAllKinds={handleClearAllKinds}
            onResetKinds={handleResetKinds}
            mapTheme={state.theme}
            onMapThemeChange={handleThemeChange}
            loading={loading}
          />
        </div>
      </div>

      <MapObjectPopup object={selected} onClose={() => handleSelectObject(null)} />

      <p className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg bg-white/75 px-2 py-1 text-[10px] text-slate backdrop-blur-sm sm:left-4">
        {attribution}
      </p>
    </div>
  );
}
