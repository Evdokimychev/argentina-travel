"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Map,
  Search,
  Share2,
  SlidersHorizontal,
  X,
  Loader2,
} from "lucide-react";
import MapCategoryFilters from "@/components/map/MapCategoryFilters";
import MapDiscoveryPresets from "@/components/map/MapDiscoveryPresets";
import MapLegend from "@/components/map/MapLegend";
import MapSearchPanel from "@/components/map/MapSearchPanel";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MapSearchSuggestion } from "@/lib/map-search";
import type { MapDiscoveryMode, MapMarkerKind } from "@/lib/map-types";

type Props = {
  objectCount: number;
  searchDraft: string;
  activeQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  suggestions: MapSearchSuggestion[];
  onSelectSuggestion: (id: string) => void;
  activeKinds: MapMarkerKind[];
  discoveryMode: MapDiscoveryMode;
  onDiscoveryModeChange: (mode: MapDiscoveryMode) => void;
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
  onSelectSuggestion,
  activeKinds,
  discoveryMode,
  onDiscoveryModeChange,
  onToggleKind,
  onSelectAllKinds,
  onClearAllKinds,
  onResetKinds,
  loading = false,
}: Props) {
  const [desktopPanelOpen, setDesktopPanelOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
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
    <>
      <h1 className="sr-only">Интерактивная карта Аргентины</h1>
      <div className="rounded-2xl border border-white/60 bg-white/92 shadow-md backdrop-blur-md md:hidden">
        <div className="flex min-h-14 items-center gap-1.5 px-2 py-1.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky">
            <Map className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-sm font-bold leading-tight text-charcoal">
              Карта Аргентины
            </div>
            <p className="flex items-center gap-1 truncate text-[11px] text-slate" aria-live="polite">
              {loading ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : null}
              {loading
                ? "Обновляем карту…"
                : activeKinds.length === 0
                  ? "Метки скрыты"
                  : `${objectCount} объектов`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate transition-colors hover:bg-sky/5 hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
            aria-label={shareCopied ? "Ссылка скопирована" : "Поделиться картой"}
            title={shareCopied ? "Ссылка скопирована" : "Поделиться картой"}
          >
            {shareCopied ? (
              <Check className="h-5 w-5 text-emerald-600" aria-hidden />
            ) : (
              <Share2 className="h-5 w-5" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileSheetOpen(true)}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky text-white shadow-sm transition-colors hover:bg-sky-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
            aria-label="Поиск и фильтры карты"
            aria-haspopup="dialog"
          >
            <SlidersHorizontal className="h-5 w-5" aria-hidden />
            {activeKinds.length > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-charcoal px-1 text-[9px] font-bold text-white">
                {activeKinds.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      <div className="hidden rounded-2xl border border-white/60 bg-white/88 shadow-md backdrop-blur-md md:block">
        <div className="flex items-center gap-2 px-3 py-2 sm:px-3.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky">
          <Map className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <div className="font-display text-sm font-bold leading-tight text-charcoal sm:text-base">
              Карта Аргентины
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate" aria-live="polite">
              {loading ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : null}
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
          onClick={() => setDesktopPanelOpen((open) => !open)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-sky hover:bg-sky/5"
          aria-expanded={desktopPanelOpen}
        >
          {desktopPanelOpen ? (
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

      {desktopPanelOpen ? (
        <div className="space-y-2 border-t border-gray-100/80 px-3 pb-3 pt-2 sm:px-3.5">
          <MapSearchPanel
            value={searchDraft}
            onChange={onSearchChange}
            onSubmit={onSearchSubmit}
            suggestions={suggestions}
            onSelectSuggestion={onSelectSuggestion}
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
          <div className="border-t border-gray-100 pt-2">
            <p className="mb-2 text-[11px] font-semibold text-charcoal">Точный выбор категорий</p>
            <MapCategoryFilters
              activeKinds={activeKinds}
              onToggle={onToggleKind}
              onSelectAll={onSelectAllKinds}
              onClearAll={onClearAllKinds}
              onReset={onResetKinds}
              compact
            />
          </div>
        </div>
      ) : null}

      <div className="border-t border-gray-100/80 px-3 pb-1.5 pt-2 sm:px-3.5">
        <MapDiscoveryPresets
          value={discoveryMode}
          onChange={onDiscoveryModeChange}
          disabled={loading}
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

      <Dialog open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <DialogContent
          bottomSheet
          className="max-sm:!inset-x-0 max-sm:!bottom-0 max-sm:!top-auto max-sm:!h-auto max-sm:!max-h-[min(78dvh,40rem)] max-sm:!w-full max-sm:!rounded-t-3xl md:hidden"
        >
          <DialogHeader className="pr-16">
            <DialogTitle>Поиск и фильтры</DialogTitle>
            <DialogDescription>
              {loading ? "Обновляем карту…" : `${objectCount} объектов по выбранным условиям`}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4">
            <section aria-labelledby="mobile-map-search-title">
              <h2 id="mobile-map-search-title" className="mb-2 text-sm font-semibold text-charcoal">
                Найти место
              </h2>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  onSearchSubmit();
                }}
                className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm"
              >
                <Search className="ml-2 h-4 w-4 shrink-0 text-slate" aria-hidden />
                <input
                  type="search"
                  value={searchDraft}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Барилоче, Игуасу…"
                  className="min-h-11 min-w-0 flex-1 bg-transparent text-base text-charcoal outline-none placeholder:text-slate"
                  aria-label="Поиск на карте"
                />
                <button
                  type="submit"
                  className="min-h-11 shrink-0 rounded-xl bg-sky px-4 text-sm font-semibold text-white hover:bg-sky-dark"
                >
                  Найти
                </button>
              </form>
              {suggestions.length > 0 && searchDraft.trim() ? (
                <ul className="mt-2 max-h-48 divide-y divide-gray-100 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
                  {suggestions.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="flex min-h-11 w-full flex-col justify-center px-4 py-2 text-left hover:bg-gray-50"
                        onClick={() => onSelectSuggestion(item.id)}
                      >
                        <span className="text-sm font-medium text-charcoal">{item.label}</span>
                        {item.subtitle ? (
                          <span className="text-xs text-slate">{item.subtitle}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {activeQuery ? (
                <div className="mt-2 flex min-h-11 items-center gap-2 rounded-xl bg-sky/5 px-3 text-sm text-charcoal">
                  <Search className="h-4 w-4 shrink-0 text-sky" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">Фильтр: «{activeQuery}»</span>
                  <button
                    type="button"
                    onClick={onSearchClear}
                    className="flex min-h-11 items-center gap-1 rounded-lg px-2 font-semibold text-sky"
                  >
                    <X className="h-4 w-4" aria-hidden />
                    Сбросить
                  </button>
                </div>
              ) : null}
            </section>

            <section aria-labelledby="mobile-map-categories-title">
              <h2 id="mobile-map-categories-title" className="mb-2 text-sm font-semibold text-charcoal">
                Что вы хотите найти
              </h2>
              <MapDiscoveryPresets
                value={discoveryMode}
                onChange={onDiscoveryModeChange}
                disabled={loading}
                className="flex-wrap overflow-visible"
              />
              <details className="mt-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-charcoal">
                  Точный выбор категорий
                </summary>
                <MapCategoryFilters
                  activeKinds={activeKinds}
                  onToggle={onToggleKind}
                  onSelectAll={onSelectAllKinds}
                  onClearAll={onClearAllKinds}
                  onReset={onResetKinds}
                  compact
                  className="mt-3"
                />
              </details>
            </section>

            <section aria-labelledby="mobile-map-legend-title">
              <h2 id="mobile-map-legend-title" className="mb-2 text-sm font-semibold text-charcoal">
                Обозначения
              </h2>
              <MapLegend activeKinds={activeKinds} className="border-gray-100 bg-gray-50 shadow-none" />
            </section>
          </DialogBody>

          <DialogFooter className="shrink-0 bg-white px-4 py-3">
            <DialogClose asChild>
              <button
                type="button"
                className="min-h-11 w-full rounded-xl bg-sky px-5 text-sm font-semibold text-white hover:bg-sky-dark"
              >
                Показать на карте
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
