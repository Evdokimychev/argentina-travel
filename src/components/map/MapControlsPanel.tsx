"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Map, Search, Share2, X } from "lucide-react";
import MapCategoryFilters from "@/components/map/MapCategoryFilters";
import MapLegend from "@/components/map/MapLegend";
import MapSearchPanel from "@/components/map/MapSearchPanel";
import type { MapMarkerKind } from "@/lib/map-types";

type Props = {
  objectCount: number;
  searchDraft: string;
  activeQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  suggestions: string[];
  activeKinds: MapMarkerKind[];
  onToggleKind: (kind: MapMarkerKind) => void;
  onSelectAllKinds: () => void;
  onClearAllKinds: () => void;
  onResetKinds: () => void;
  loading?: boolean;
};

export default function MapControlsPanel({
  objectCount,
  searchDraft,
  activeQuery,
  onSearchChange,
  onSearchSubmit,
  onSearchClear,
  suggestions,
  activeKinds,
  onToggleKind,
  onSelectAllKinds,
  onClearAllKinds,
  onResetKinds,
  loading = false,
}: Props) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const shareResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (shareResetTimer.current) clearTimeout(shareResetTimer.current);
    };
  }, []);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      if (shareResetTimer.current) clearTimeout(shareResetTimer.current);
      shareResetTimer.current = setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // clipboard недоступен (например, http без TLS) — молча пропускаем
    }
  }

  return (
    <div className="rounded-2xl border border-white/60 bg-white/88 shadow-md backdrop-blur-md">
      <div className="flex items-center gap-2 px-3 py-2 sm:px-3.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky">
          <Map className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <h1 className="font-display text-sm font-bold leading-tight text-charcoal sm:text-base">
              Карта Аргентины
            </h1>
            <span className="text-[11px] text-slate">
              {loading ? "обновление…" : activeKinds.length === 0 ? "метки скрыты" : `${objectCount} на карте`}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate hover:bg-sky/5 hover:text-sky"
          title="Скопировать ссылку на текущий вид карты"
        >
          {shareCopied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
              Скопировано
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Поделиться</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setPanelOpen((open) => !open)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-sky hover:bg-sky/5"
          aria-expanded={panelOpen}
        >
          {panelOpen ? (
            <>
              Свернуть
              <ChevronUp className="h-3.5 w-3.5" aria-hidden />
            </>
          ) : (
            <>
              Ещё
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </>
          )}
        </button>
      </div>

      {panelOpen ? (
        <div className="space-y-2 border-t border-gray-100/80 px-3 pb-3 pt-2 sm:px-3.5">
          <MapSearchPanel
            value={searchDraft}
            onChange={onSearchChange}
            onSubmit={onSearchSubmit}
            suggestions={suggestions}
            compact
          />
          {activeQuery ? (
            <div className="flex items-center gap-2 rounded-lg bg-sky/5 px-2.5 py-1.5 text-[11px] text-charcoal">
              <Search className="h-3 w-3 shrink-0 text-sky" aria-hidden />
              <span className="min-w-0 flex-1 truncate">Фильтр: «{activeQuery}»</span>
              <button
                type="button"
                onClick={onSearchClear}
                className="inline-flex items-center gap-0.5 font-semibold text-sky hover:underline"
              >
                <X className="h-3 w-3" aria-hidden />
                Сбросить
              </button>
            </div>
          ) : null}
          <p className="text-[10px] leading-snug text-slate">
            Стиль карты и слои (рельеф, 3D, спутник) — в кнопке
            <span className="mx-1 inline-flex h-4 w-4 items-center justify-center rounded bg-sky/10 align-middle text-sky">▣</span>
            у правого края карты.
          </p>
        </div>
      ) : null}

      <div className="border-t border-gray-100/80 px-3 py-2 sm:px-3.5">
        <MapCategoryFilters
          activeKinds={activeKinds}
          onToggle={onToggleKind}
          onSelectAll={onSelectAllKinds}
          onClearAll={onClearAllKinds}
          onReset={onResetKinds}
          compact
        />
      </div>

      <div className="border-t border-gray-100/80 px-3 py-1.5 sm:px-3.5">
        <button
          type="button"
          onClick={() => setLegendOpen((open) => !open)}
          className="flex w-full items-center justify-between py-1 text-[11px] font-semibold text-slate hover:text-charcoal"
          aria-expanded={legendOpen}
        >
          Обозначения
          {legendOpen ? (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
        {legendOpen ? (
          <MapLegend activeKinds={activeKinds} className="mt-1 border-0 bg-transparent p-0 shadow-none" />
        ) : null}
      </div>
    </div>
  );
}
