"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import {
  ensureWlSearchParamsInUrl,
  hasMinimumFlightsSearchParams,
  type ParsedFlightsSearch,
  type WlUrlSyncMode,
} from "@/lib/flights/wl-search-params";
import {
  TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID,
  TRAVELPAYOUTS_WHITELABEL_TICKETS_CONTAINER_ID,
} from "@/lib/travelpayouts/whitelabel/config";
import { safeRemoveElement } from "@/lib/dom/safe-partner-dom";
import { injectTravelpayoutsWhitelabelScript } from "@/lib/travelpayouts/whitelabel/inject-travelpayouts-whitelabel-script";
import { resetTravelpayoutsWhitelabelWidget } from "@/lib/travelpayouts/whitelabel/reset-travelpayouts-whitelabel-widget";
import { removeAviasalesInjectedStyles } from "@/lib/travelpayouts/whitelabel/sanitize-aviasales-styles";
import {
  scrollTravelpayoutsWhitelabelResultsIntoView,
  syncTravelpayoutsWhitelabelMount,
} from "@/lib/travelpayouts/whitelabel/sync-travelpayouts-whitelabel";
import { triggerTravelpayoutsWhitelabelSearch } from "@/lib/travelpayouts/whitelabel/trigger-wl-search";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import "./flights-whitelabel-widget.css";
import { trackProductEvent } from "@/lib/analytics/product-events";

const AUTO_SEARCH_RETRY_MS = [400, 900, 1800, 3200];
const WIDGET_SYNC_RETRY_MS = [100, 500, 1500, 3000, 6000];
const WIDGET_READY_TIMEOUT_MS = 10_000;

type WidgetStatus = "loading" | "ready" | "error";

export type FlightsWhitelabelWidgetCoreProps = {
  scriptUrl: string;
  loadingLabel: string;
  parsedSearch: ParsedFlightsSearch | null;
  className?: string;
  mountId?: string;
  resultsOnly?: boolean;
  /** How to sync WL params into `window.location.search` before the script reads them. */
  urlSync?: WlUrlSyncMode;
};

export default function FlightsWhitelabelWidgetCore({
  scriptUrl,
  loadingLabel,
  parsedSearch,
  className,
  mountId,
  resultsOnly = false,
  urlSync = "none",
}: FlightsWhitelabelWidgetCoreProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const resultsScrolledRef = useRef(false);
  const autoSearchStartedRef = useRef(false);
  const readyTrackedRef = useRef(false);
  const errorTrackedRef = useRef(false);
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const [retryKey, setRetryKey] = useState(0);

  const retryWidget = useCallback(() => {
    resetTravelpayoutsWhitelabelWidget();
    setStatus("loading");
    setRetryKey((value) => value + 1);
  }, []);

  useEffect(() => {
    autoSearchStartedRef.current = false;
    resultsScrolledRef.current = false;
  }, [parsedSearch]);

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl || !scriptUrl) return;

    const abortController = new AbortController();
    let disposed = false;
    const autoSearchTimers: number[] = [];
    const syncTimers: number[] = [];
    let ticketsObserver: MutationObserver | null = null;
    let readyTimeout = 0;

    if (urlSync === "inline") {
      resetTravelpayoutsWhitelabelWidget();
    }

    if (parsedSearch && urlSync !== "none") {
      ensureWlSearchParamsInUrl(parsedSearch, urlSync);
    }

    function markReady() {
      if (!disposed) {
        setStatus("ready");
        if (!readyTrackedRef.current) {
          readyTrackedRef.current = true;
          trackProductEvent("flights_widget_ready", { source: "travelpayouts" });
        }
        window.clearTimeout(readyTimeout);
      }
    }

    function markError() {
      if (!disposed) {
        setStatus("error");
        if (!errorTrackedRef.current) {
          errorTrackedRef.current = true;
          trackProductEvent("flights_widget_error", { source: "travelpayouts", errorCategory: "widget_load" });
        }
      }
    }

    function ticketsHaveResults(): boolean {
      const tickets = document.getElementById(TRAVELPAYOUTS_WHITELABEL_TICKETS_CONTAINER_ID);
      return Boolean(tickets && tickets.childElementCount > 0);
    }

    function maybeScrollToResults() {
      if (disposed || resultsScrolledRef.current) return;
      if (!ticketsHaveResults()) {
        resultsScrolledRef.current = false;
        return;
      }
      if (scrollTravelpayoutsWhitelabelResultsIntoView()) {
        resultsScrolledRef.current = true;
        trackProductEvent("flights_results_opened", { source: "travelpayouts" });
      }
    }

    function maybeAutoStartSearch(widgetReady: boolean) {
      if (
        disposed ||
        !widgetReady ||
        !parsedSearch?.autoSearch ||
        !hasMinimumFlightsSearchParams(parsedSearch) ||
        autoSearchStartedRef.current ||
        ticketsHaveResults()
      ) {
        return;
      }

      if (triggerTravelpayoutsWhitelabelSearch()) {
        autoSearchStartedRef.current = true;
        trackProductEvent("flights_search_started", { source: "travelpayouts", entityType: "flight_route" });
      }
    }

    function scheduleAutoSearchRetries(widgetReady: boolean) {
      if (
        disposed ||
        !widgetReady ||
        !parsedSearch?.autoSearch ||
        !hasMinimumFlightsSearchParams(parsedSearch) ||
        autoSearchStartedRef.current
      ) {
        return;
      }

      for (const delay of AUTO_SEARCH_RETRY_MS) {
        autoSearchTimers.push(
          window.setTimeout(() => {
            if (disposed || autoSearchStartedRef.current || ticketsHaveResults()) return;
            maybeAutoStartSearch(true);
          }, delay),
        );
      }
    }

    function syncWidget() {
      const root = mountRef.current;
      if (disposed || !root?.isConnected) return;
      const widgetReady = syncTravelpayoutsWhitelabelMount(root);
      if (widgetReady) {
        markReady();
        maybeAutoStartSearch(true);
      }
      const tickets = document.getElementById(TRAVELPAYOUTS_WHITELABEL_TICKETS_CONTAINER_ID);
      if (tickets && !ticketsObserver) {
        ticketsObserver = new MutationObserver(() => {
          syncWidget();
          maybeScrollToResults();
        });
        ticketsObserver.observe(tickets, { childList: true, subtree: true });
      }
      maybeScrollToResults();
      return widgetReady;
    }

    const script = injectTravelpayoutsWhitelabelScript(scriptUrl);
    script?.addEventListener("load", () => {
      if (disposed || !mountRef.current?.isConnected) return;
      const widgetReady = syncWidget();
      scheduleAutoSearchRetries(Boolean(widgetReady));
    }, { signal: abortController.signal });
    script?.addEventListener("error", markError, { signal: abortController.signal });

    const observer = new MutationObserver(syncWidget);
    observer.observe(mountEl, { childList: true, subtree: true });

    const initialReady = syncWidget();
    scheduleAutoSearchRetries(Boolean(initialReady));
    for (const delay of WIDGET_SYNC_RETRY_MS) {
      syncTimers.push(window.setTimeout(syncWidget, delay));
    }
    readyTimeout = window.setTimeout(() => {
      if (!disposed && !syncWidget()) markError();
    }, WIDGET_READY_TIMEOUT_MS);

    return () => {
      disposed = true;
      abortController.abort();
      observer.disconnect();
      ticketsObserver?.disconnect();
      window.clearTimeout(readyTimeout);
      for (const timer of autoSearchTimers) window.clearTimeout(timer);
      for (const timer of syncTimers) window.clearTimeout(timer);
      removeAviasalesInjectedStyles();
      if (urlSync === "inline") {
        resetTravelpayoutsWhitelabelWidget();
      } else {
        const modals = document.getElementById("tpwl-modals");
        if (modals?.parentElement === document.body) safeRemoveElement(modals);
      }
    };
  }, [scriptUrl, parsedSearch, retryKey, urlSync]);

  return (
    <div
      id={mountId}
      ref={mountRef}
      data-widget-status={status}
      className={cn("flights-wl-root", resultsOnly && "flights-wl-root--results-only", className)}
    >
      <div className="flights-wl-mount">
        {status === "loading" ? (
          <div
            className={cn("px-4 py-5 sm:px-5 sm:py-6", resultsOnly && "py-3")}
            aria-live="polite"
          >
            <span className="sr-only">{loadingLabel}</span>
            {resultsOnly ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-11 w-full rounded-xl" />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Skeleton className="h-11 rounded-xl" />
                  <Skeleton className="h-11 rounded-xl" />
                  <Skeleton className="h-11 rounded-xl" />
                  <Skeleton className="h-11 rounded-xl" />
                </div>
                <Skeleton className="h-12 w-full rounded-xl sm:max-w-[200px]" />
              </div>
            )}
          </div>
        ) : null}
        {status === "error" ? (
          <div className="px-4 py-6 text-center sm:px-6" role="alert">
            <p className="font-heading text-base font-semibold text-foreground">
              Поиск авиабилетов временно не загрузился
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Параметры маршрута сохранены. Попробуйте ещё раз или продолжите поиск у партнёра.
            </p>
            <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
              <button
                type="button"
                onClick={retryWidget}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-ink px-4 text-sm font-semibold text-white"
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                Повторить
              </button>
              <a
                href="https://www.aviasales.ru"
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={() => trackProductEvent("flights_results_opened", { source: "aviasales_fallback", outcome: "external" })}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-subtle px-4 text-sm font-semibold text-foreground"
              >
                Открыть Aviasales
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>
        ) : null}
        <div id={TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID} />
      </div>
      <div
        id={TRAVELPAYOUTS_WHITELABEL_TICKETS_CONTAINER_ID}
        className="flights-wl-results scroll-mt-[calc(var(--site-header-height,72px)+1rem)]"
      />
    </div>
  );
}
