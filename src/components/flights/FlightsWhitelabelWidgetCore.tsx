"use client";

import { useEffect, useRef, useState } from "react";
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

const AUTO_SEARCH_RETRY_MS = [400, 900, 1800, 3200];

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    autoSearchStartedRef.current = false;
    resultsScrolledRef.current = false;
  }, [parsedSearch]);

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl || !scriptUrl) return;

    let disposed = false;
    const autoSearchTimers: number[] = [];

    if (urlSync === "inline") {
      resetTravelpayoutsWhitelabelWidget();
    }

    if (parsedSearch && urlSync !== "none") {
      ensureWlSearchParamsInUrl(parsedSearch, urlSync);
    }

    function markReady() {
      if (!disposed) setReady(true);
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
      maybeScrollToResults();
      return widgetReady;
    }

    const script = injectTravelpayoutsWhitelabelScript(scriptUrl);
    script?.addEventListener("load", () => {
      if (disposed || !mountRef.current?.isConnected) return;
      const widgetReady = syncWidget();
      window.setTimeout(syncWidget, 100);
      window.setTimeout(syncWidget, 500);
      window.setTimeout(() => {
        const readyNow = syncWidget();
        scheduleAutoSearchRetries(Boolean(readyNow ?? widgetReady));
      }, 1500);
    });
    script?.addEventListener("error", markReady);

    const observer = new MutationObserver(syncWidget);
    observer.observe(mountEl, { childList: true, subtree: true });
    observer.observe(document.head, { childList: true, subtree: true });
    observer.observe(document.body, { childList: true, subtree: true });

    const tickets = document.getElementById(TRAVELPAYOUTS_WHITELABEL_TICKETS_CONTAINER_ID);
    const ticketsObserver = new MutationObserver(() => {
      syncWidget();
      maybeScrollToResults();
    });
    if (tickets) {
      ticketsObserver.observe(tickets, { childList: true, subtree: true });
    }

    const interval = window.setInterval(syncWidget, 300);
    const stopInterval = window.setTimeout(() => window.clearInterval(interval), 60000);

    const initialReady = syncWidget();
    scheduleAutoSearchRetries(Boolean(initialReady));

    const onScrollReposition = () => {
      window.dispatchEvent(new Event("resize"));
    };
    window.addEventListener("scroll", onScrollReposition, { passive: true, capture: true });

    return () => {
      disposed = true;
      observer.disconnect();
      ticketsObserver?.disconnect();
      window.clearInterval(interval);
      window.clearTimeout(stopInterval);
      for (const timer of autoSearchTimers) window.clearTimeout(timer);
      window.removeEventListener("scroll", onScrollReposition, { capture: true });
      removeAviasalesInjectedStyles();
      if (urlSync === "inline") {
        resetTravelpayoutsWhitelabelWidget();
      } else {
        const modals = document.getElementById("tpwl-modals");
        if (modals?.parentElement === document.body) safeRemoveElement(modals);
      }
    };
  }, [scriptUrl, parsedSearch, urlSync]);

  return (
    <div
      id={mountId}
      ref={mountRef}
      className={cn("flights-wl-root", resultsOnly && "flights-wl-root--results-only", className)}
    >
      <div className="flights-wl-mount">
        {!ready ? (
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
        <div id={TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID} />
      </div>
      <div
        id={TRAVELPAYOUTS_WHITELABEL_TICKETS_CONTAINER_ID}
        className="flights-wl-results scroll-mt-[calc(var(--site-header-height,72px)+1rem)]"
      />
    </div>
  );
}
