"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  MapPinned,
  Search,
} from "lucide-react";
import ArgentinaMapLibreCanvas from "@/components/map/ArgentinaMapLibreCanvas";
import QuickExploreSpotCard from "@/components/quick-explore/QuickExploreSpotCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuickExplore } from "@/context/QuickExploreContext";
import { cn } from "@/lib/cn";
import { tokenButtonOutlineClass, tokenFocusRingClass } from "@/lib/design-tokens";
import { DEFAULT_MAP_OVERLAY_STATE } from "@/lib/map-overlay-layers";
import {
  DEFAULT_MAP_THEMATIC_STATE,
  type MapThematicState,
} from "@/lib/map-thematic-layers";
import { serializeMapArgentinaKinds } from "@/lib/map-argentina-url-state";
import { ARGENTINA_MAP_VIEW } from "@/lib/map-view-config";
import type { MapMarkerKind, MapObject } from "@/lib/map-types";
import { spotsToMapObjects } from "@/lib/quick-explore/spot-to-map-object";
import { SITE_MAP_OPEN_EVENT } from "@/lib/site-map-events";
import type {
  QuickExploreProvince,
  QuickExploreSpot,
} from "@/lib/quick-explore/types";

const EXPLORE_KINDS: MapMarkerKind[] = ["city", "national_park", "attraction"];

const QUICK_THEMATIC: MapThematicState = {
  ...DEFAULT_MAP_THEMATIC_STATE,
  provinces: true,
  argentina_border: true,
};

/** Широкая панель с отступами от краёв viewport и safe-area. */
const QUICK_MODAL_SHELL_CLASS =
  "!fixed !inset-x-3 !top-[max(0.75rem,env(safe-area-inset-top))] !bottom-auto !left-auto !right-auto !h-[min(calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem),820px)] !max-h-[min(calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem),820px)] !w-[min(calc(100vw-1.5rem),1120px)] !max-w-[min(calc(100vw-1.5rem),1120px)] !translate-x-0 !translate-y-0 sm:!inset-auto sm:!left-1/2 sm:!top-1/2 sm:!-translate-x-1/2 sm:!-translate-y-1/2";

function normalizeQuery(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function filterProvinces(provinces: QuickExploreProvince[], query: string): QuickExploreProvince[] {
  const needle = normalizeQuery(query);
  if (!needle) return provinces;
  return provinces.filter(
    (p) =>
      normalizeQuery(p.nameRu).includes(needle) ||
      normalizeQuery(p.macroRegionRu).includes(needle)
  );
}

function filterSpots(spots: QuickExploreSpot[], query: string): QuickExploreSpot[] {
  const needle = normalizeQuery(query);
  if (!needle) return spots;
  return spots.filter(
    (s) =>
      normalizeQuery(s.title).includes(needle) ||
      normalizeQuery(s.summary).includes(needle) ||
      normalizeQuery(s.region).includes(needle)
  );
}

export default function QuickExploreMapDialog({ initialOpen = false }: { initialOpen?: boolean }) {
  const { payload, loading, error, refresh } = useQuickExplore();
  const [open, setOpen] = useState(false);
  const [provinceIso, setProvinceIso] = useState<string | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialOpen) setOpen(true);
  }, [initialOpen]);

  useEffect(() => {
    function onOpenRequest() {
      setOpen(true);
    }
    window.addEventListener(SITE_MAP_OPEN_EVENT, onOpenRequest);
    return () => window.removeEventListener(SITE_MAP_OPEN_EVENT, onOpenRequest);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open]);

  const resetState = useCallback(() => {
    setProvinceIso(null);
    setSelectedSpotId(null);
    setQuery("");
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) resetState();
    },
    [resetState]
  );

  const selectedProvince = useMemo(
    () => payload?.provinces.find((p) => p.iso === provinceIso) ?? null,
    [payload, provinceIso]
  );

  const provinceSpots = useMemo(() => {
    if (!payload || !provinceIso) return [];
    return payload.spots.filter((s) => s.provinceIso === provinceIso);
  }, [payload, provinceIso]);

  const visibleSpots = useMemo(
    () => filterSpots(provinceSpots, query),
    [provinceSpots, query]
  );

  const visibleProvinces = useMemo(
    () => (payload ? filterProvinces(payload.provinces, query) : []),
    [payload, query]
  );

  const selectedSpot = useMemo(
    () =>
      visibleSpots.find((s) => s.id === selectedSpotId) ??
      provinceSpots.find((s) => s.id === selectedSpotId) ??
      null,
    [visibleSpots, provinceSpots, selectedSpotId]
  );

  const mapObjects = useMemo(
    () => spotsToMapObjects(provinceIso ? provinceSpots : []),
    [provinceIso, provinceSpots]
  );

  const mapView = useMemo(() => {
    if (selectedProvince) {
      return {
        center: selectedProvince.center,
        zoom: selectedProvince.zoom,
        minZoom: 4,
        maxZoom: 14,
        lockView: false,
      };
    }
    return { ...ARGENTINA_MAP_VIEW, lockView: false };
  }, [selectedProvince]);

  function selectProvince(iso: string) {
    setProvinceIso(iso);
    setSelectedSpotId(null);
    setQuery("");
  }

  function goBackToProvinces() {
    setProvinceIso(null);
    setSelectedSpotId(null);
    setQuery("");
  }

  function handleMapSelect(obj: MapObject | null) {
    if (!obj) {
      setSelectedSpotId(null);
      return;
    }
    setSelectedSpotId(obj.id);
  }

  const fullMapHref = useMemo(() => {
    if (selectedSpot?.id.startsWith("place:")) {
      const params = new URLSearchParams();
      params.set("selected", selectedSpot.id);
      params.set("kind", serializeMapArgentinaKinds(EXPLORE_KINDS));
      return `/mapa-argentina?${params.toString()}`;
    }
    if (selectedProvince) {
      return `/mapa-argentina?city=${encodeURIComponent(selectedProvince.slug)}`;
    }
    return "/mapa-argentina";
  }, [selectedSpot, selectedProvince]);

  const showDataLoader = loading && !payload;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        bottomSheet={false}
        showClose
        className={cn(
          "flex flex-col overflow-hidden rounded-3xl p-0 shadow-modal",
          QUICK_MODAL_SHELL_CLASS
        )}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          searchRef.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">Быстрая карта — куда поехать в Аргентине</DialogTitle>
        <DialogDescription className="sr-only">
          Выберите провинцию и достопримечательность на упрощённой интерактивной карте
        </DialogDescription>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="relative min-h-[220px] flex-1 bg-[#e8eef4] lg:min-h-0 lg:basis-[58%]">
            {showDataLoader ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-slate">
                <Loader2 className="h-5 w-5 animate-spin text-sky" />
                Загружаем места…
              </div>
            ) : (
              <ArgentinaMapLibreCanvas
                objects={mapObjects}
                routes={[]}
                activeKinds={EXPLORE_KINDS}
                selectedId={selectedSpotId}
                theme="nature"
                overlays={DEFAULT_MAP_OVERLAY_STATE}
                thematic={QUICK_THEMATIC}
                onSelect={handleMapSelect}
                view={mapView}
                className="h-full w-full"
              />
            )}

            {!provinceIso && !showDataLoader ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/35 to-transparent px-4 pb-4 pt-10">
                <p className="text-sm font-medium text-white drop-shadow-sm">
                  Выберите провинцию справа — на карте появятся города и парки
                </p>
              </div>
            ) : null}
          </div>

          <aside className="flex min-h-0 flex-col border-t border-border-subtle bg-surface-elevated lg:w-[42%] lg:max-w-[480px] lg:border-l lg:border-t-0">
            <header className="shrink-0 border-b border-border-subtle px-4 py-3 sm:px-5">
              <div className="mb-3 flex items-center gap-2">
                {provinceIso ? (
                  <button
                    type="button"
                    onClick={goBackToProvinces}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-1 rounded-lg pr-2 text-xs font-semibold uppercase tracking-wide text-sky transition-colors hover:text-sky-ink",
                      tokenFocusRingClass
                    )}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
                    Назад
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate">
                    <MapPinned className="h-3.5 w-3.5 text-sky" strokeWidth={2} />
                    Куда поехать?
                  </span>
                )}
              </div>

              <div className="flex min-h-11 items-center gap-2 rounded-xl border border-border-subtle bg-surface-muted/60 px-3">
                <Search className="h-4 w-4 shrink-0 text-sky" strokeWidth={1.75} />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={
                    provinceIso
                      ? "Города, парки, достопримечательности…"
                      : "Провинция или регион…"
                  }
                  className="min-h-11 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-slate/70"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {selectedProvince ? (
                <p className="mt-2 text-sm font-bold text-foreground">{selectedProvince.nameRu}</p>
              ) : null}
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 sm:px-3">
              {error ? (
                <div className="px-2 py-6 text-center text-sm text-red-600">
                  {error}
                  <button
                    type="button"
                    onClick={() => void refresh()}
                    className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg text-sky underline"
                  >
                    Повторить
                  </button>
                </div>
              ) : null}

              {!provinceIso && !error ? (
                <ul className="space-y-0.5">
                  {visibleProvinces.map((province) => (
                    <li key={province.iso}>
                      <button
                        type="button"
                        onClick={() => selectProvince(province.iso)}
                        className={cn(
                          "group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-sky/5",
                          tokenFocusRingClass
                        )}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold uppercase tracking-tight text-foreground group-hover:text-sky-ink">
                            {province.nameRu}
                          </p>
                          <p className="text-2xs text-slate">
                            {province.macroRegionRu}
                            {province.spotCount > 0
                              ? ` · ${province.spotCount} ${province.spotCount === 1 ? "место" : province.spotCount < 5 ? "места" : "мест"}`
                              : ""}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate/50 group-hover:text-sky" />
                      </button>
                    </li>
                  ))}
                  {visibleProvinces.length === 0 && !showDataLoader ? (
                    <p className="px-3 py-8 text-center text-sm text-slate">Ничего не найдено</p>
                  ) : null}
                </ul>
              ) : null}

              {provinceIso && !selectedSpot ? (
                <ul className="space-y-0.5">
                  {visibleSpots.map((spot) => (
                    <li key={spot.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedSpotId(spot.id)}
                        className={cn(
                          "group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-sky/5",
                          selectedSpotId === spot.id && "bg-sky/8",
                          tokenFocusRingClass
                        )}
                      >
                        {spot.image?.url ? (
                          <span className="relative mt-0.5 h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-charcoal/5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={spot.image.url}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </span>
                        ) : null}
                        <span className="min-w-0 flex-1">
                          <p className="text-sm font-bold uppercase tracking-tight text-foreground group-hover:text-sky-ink">
                            {spot.title}
                          </p>
                          {spot.summary ? (
                            <p className="mt-0.5 line-clamp-2 text-2xs leading-relaxed text-slate">
                              {spot.summary}
                            </p>
                          ) : null}
                        </span>
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate/50 group-hover:text-sky" />
                      </button>
                    </li>
                  ))}
                  {visibleSpots.length === 0 && !showDataLoader ? (
                    <p className="px-3 py-8 text-center text-sm text-slate">
                      В этой провинции пока нет отмеченных мест
                    </p>
                  ) : null}
                </ul>
              ) : null}

              {selectedSpot ? (
                <QuickExploreSpotCard
                  spot={selectedSpot}
                  onClose={() => setSelectedSpotId(null)}
                  className="mx-1 my-1"
                />
              ) : null}
            </div>

            <footer className="shrink-0 border-t border-border-subtle px-4 py-3 sm:px-5">
              <Link
                href={fullMapHref}
                onClick={() => handleOpenChange(false)}
                className={cn(
                  "flex min-h-11 w-full items-center justify-center gap-2 rounded-pill px-4 py-2.5 text-sm font-semibold transition-colors",
                  tokenButtonOutlineClass,
                  tokenFocusRingClass
                )}
              >
                Открыть полную карту
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </footer>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
