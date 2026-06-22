"use client";

import { useEffect, useRef, useState } from "react";
import {
  TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID,
  TRAVELPAYOUTS_WHITELABEL_TICKETS_CONTAINER_ID,
} from "@/lib/travelpayouts/whitelabel/config";
import { FLIGHTS_WL_PAGE_MOUNT_ID } from "@/lib/travelpayouts/whitelabel/flights-dom-ids";
import { injectTravelpayoutsWhitelabelScript } from "@/lib/travelpayouts/whitelabel/inject-travelpayouts-whitelabel-script";
import { removeAviasalesInjectedStyles } from "@/lib/travelpayouts/whitelabel/sanitize-aviasales-styles";
import { syncTravelpayoutsWhitelabelMount } from "@/lib/travelpayouts/whitelabel/sync-travelpayouts-whitelabel";
import { cn } from "@/lib/utils";
import "./flights-whitelabel-widget.css";

type FlightsWhitelabelWidgetProps = {
  scriptUrl: string;
  loadingLabel: string;
  className?: string;
};

export default function FlightsWhitelabelWidget({
  scriptUrl,
  loadingLabel,
  className,
}: FlightsWhitelabelWidgetProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !scriptUrl) return;

    let disposed = false;

    function markReady() {
      if (!disposed) setReady(true);
    }

    function syncWidget() {
      if (disposed || !mount) return;
      if (syncTravelpayoutsWhitelabelMount(mount)) markReady();
    }

    const script = injectTravelpayoutsWhitelabelScript(scriptUrl);
    script?.addEventListener("load", () => {
      syncWidget();
      window.setTimeout(syncWidget, 100);
      window.setTimeout(syncWidget, 500);
      window.setTimeout(syncWidget, 1500);
    });
    script?.addEventListener("error", markReady);

    const observer = new MutationObserver(syncWidget);
    observer.observe(mount, { childList: true, subtree: true });
    observer.observe(document.head, { childList: true, subtree: true });
    observer.observe(document.body, { childList: true, subtree: true });

    const interval = window.setInterval(syncWidget, 300);
    const stopInterval = window.setTimeout(() => window.clearInterval(interval), 60000);

    syncWidget();

    const onScrollReposition = () => {
      window.dispatchEvent(new Event("resize"));
    };
    window.addEventListener("scroll", onScrollReposition, { passive: true, capture: true });

    return () => {
      disposed = true;
      observer.disconnect();
      window.clearInterval(interval);
      window.clearTimeout(stopInterval);
      window.removeEventListener("scroll", onScrollReposition, { capture: true });
      removeAviasalesInjectedStyles();
      document.getElementById("tpwl-modals")?.remove();
    };
  }, [scriptUrl]);

  return (
    <div
      id={FLIGHTS_WL_PAGE_MOUNT_ID}
      ref={mountRef}
      className={cn("flights-wl-mount px-3 py-4 sm:px-4", className)}
    >
      {!ready ? (
        <p className="mb-3 text-sm text-slate" aria-live="polite">
          {loadingLabel}
        </p>
      ) : null}
      {/* Official Travelpayouts embed containers — see dashboard «Код вставки». */}
      <div id={TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID} />
      <div id={TRAVELPAYOUTS_WHITELABEL_TICKETS_CONTAINER_ID} className="mt-4" />
    </div>
  );
}
