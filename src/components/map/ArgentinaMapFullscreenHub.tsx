"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import MapCategoryFilters from "@/components/map/MapCategoryFilters";
import MapObjectCard from "@/components/map/MapObjectCard";
import MapSearchPanel from "@/components/map/MapSearchPanel";
import {
  buildMapArgentinaPath,
  parseMapArgentinaUrlState,
  toggleMapArgentinaKind,
  type MapArgentinaUrlState,
} from "@/lib/map-argentina-url-state";
import type { MapMarkerKind, MapObject, MapObjectsPayload } from "@/lib/map-types";

const ArgentinaMapLibreCanvas = dynamic(
  () => import("@/components/map/ArgentinaMapLibreCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-gray-50 text-sm text-slate">
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
    const params = new URLSearchParams();
    params.set("kind", nextState.kinds.join(","));
    if (nextState.city) params.set("city", nextState.city);
    if (nextState.q) params.set("q", nextState.q);

    try {
      const response = await fetch(`/api/map/objects?${params.toString()}`);
      if (!response.ok) return;
      const payload = (await response.json()) as MapObjectsPayload;
      setData(payload);
    } catch {
      // keep previous
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
    const match = data.objects.find((obj) =>
      `${obj.title} ${obj.meta ?? ""}`.toLowerCase().includes(q.toLowerCase())
    );
    const nextState: MapArgentinaUrlState = {
      ...state,
      q,
      selected: match?.id ?? "",
    };
    applyState(nextState);
    if (match) setSelected(match);
  }

  function handleToggleKind(kind: MapMarkerKind) {
    applyState({ ...state, kinds: toggleMapArgentinaKind(state.kinds, kind) });
  }

  function handleSelectObject(obj: MapObject | null) {
    setSelected(obj);
    replaceUrl({ ...state, selected: obj?.id ?? "" });
  }

  return (
    <div className="relative h-[calc(100dvh-var(--site-header-full-height,72px))] min-h-[520px] w-full">
      <ArgentinaMapLibreCanvas
        objects={visibleObjects}
        routes={visibleRoutes}
        activeKinds={state.kinds}
        selectedId={selected?.id ?? (state.selected || null)}
        onSelect={handleSelectObject}
        className="absolute inset-0"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-3 p-4 sm:p-5">
        <div className="pointer-events-auto mx-auto w-full max-w-6xl space-y-3">
          <div className="rounded-2xl border border-gray-100/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-md sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky">Карта страны</p>
            <h1 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
              Интерактивная карта Аргентины
            </h1>
            <p className="mt-1 text-sm text-slate">
              Города, парки, достопримечательности, экскурсии и аэропорты — OpenStreetMap, без Google Maps
            </p>
          </div>

          <MapSearchPanel
            value={searchDraft}
            onChange={setSearchDraft}
            onSubmit={handleSearchSubmit}
            suggestions={suggestions}
          />

          <MapCategoryFilters activeKinds={state.kinds} onToggle={handleToggleKind} />
        </div>
      </div>

      {selected ? (
        <div className="pointer-events-none absolute bottom-4 right-4 z-20 max-w-[calc(100%-2rem)] sm:bottom-6 sm:right-6">
          <div className="pointer-events-auto">
            <MapObjectCard object={selected} onClose={() => handleSelectObject(null)} />
          </div>
        </div>
      ) : null}

      <p className="pointer-events-none absolute bottom-3 left-4 z-10 text-[10px] text-slate/80 sm:left-5">
        {visibleObjects.length} объектов · © OpenStreetMap
      </p>
    </div>
  );
}
