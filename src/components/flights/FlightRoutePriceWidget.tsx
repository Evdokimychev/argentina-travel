"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getFlightRouteLabels } from "@/lib/flights/route-labels";
import { buildFlightsSearchHref } from "@/lib/flights/search-href";
import { safeClearElementContent, safeRemoveElement } from "@/lib/dom/safe-partner-dom";
import {
  FLIGHT_PRICE_WIDGET_MOUNT_ID,
  FLIGHT_PRICE_WIDGET_SCRIPT_ID,
  FLIGHT_PRICE_WIDGET_SCRIPT_MOUNT_ID,
} from "@/lib/travelpayouts/price-widget-dom-ids";
import { cn } from "@/lib/utils";
import type { LocaleCode } from "@/types/locale";
import "./flight-route-price-widget.css";

type FlightRoutePriceWidgetProps = {
  origin: string;
  destination: string;
  scriptUrl: string;
  locale?: LocaleCode;
  className?: string;
};

function mountHasWidgetContent(mount: HTMLElement): boolean {
  return mount.childElementCount > 1 || mount.offsetHeight > 160;
}

export default function FlightRoutePriceWidget({
  origin,
  destination,
  scriptUrl,
  locale = "ru",
  className,
}: FlightRoutePriceWidgetProps) {
  const labels = getFlightRouteLabels(locale);
  const searchHref = buildFlightsSearchHref(origin, destination);
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
      if (mountHasWidgetContent(mount)) markReady();
    }

    function injectScript() {
      if (!mount) return;

      let scriptMount = mount.querySelector<HTMLElement>(`#${FLIGHT_PRICE_WIDGET_SCRIPT_MOUNT_ID}`);
      if (!scriptMount) {
        scriptMount = document.createElement("div");
        scriptMount.id = FLIGHT_PRICE_WIDGET_SCRIPT_MOUNT_ID;
        mount.appendChild(scriptMount);
      }

      if (scriptMount.querySelector(`#${FLIGHT_PRICE_WIDGET_SCRIPT_ID}`)) {
        syncWidget();
        return;
      }

      const script = document.createElement("script");
      script.id = FLIGHT_PRICE_WIDGET_SCRIPT_ID;
      script.async = true;
      script.charset = "utf-8";
      script.src = scriptUrl;
      script.addEventListener("load", () => {
        syncWidget();
        window.setTimeout(syncWidget, 100);
        window.setTimeout(syncWidget, 500);
        window.setTimeout(syncWidget, 1500);
      });
      script.addEventListener("error", markReady);
      scriptMount.appendChild(script);
    }

    injectScript();

    const observer = new MutationObserver(syncWidget);
    observer.observe(mount, { childList: true, subtree: true });
    observer.observe(document.body, { childList: true, subtree: true });

    const interval = window.setInterval(syncWidget, 300);
    const stopInterval = window.setTimeout(() => window.clearInterval(interval), 60000);

    syncWidget();

    return () => {
      disposed = true;
      observer.disconnect();
      window.clearInterval(interval);
      window.clearTimeout(stopInterval);
      safeRemoveElement(document.getElementById(FLIGHT_PRICE_WIDGET_SCRIPT_ID));
      safeClearElementContent(mount);
    };
  }, [scriptUrl]);

  return (
    <section className={cn("rounded-3xl border border-gray-100 bg-white p-6 shadow-card sm:p-8", className)}>
      <header className="flex items-start gap-3 border-b border-gray-100 pb-4">
        <CalendarDays className="mt-0.5 h-6 w-6 shrink-0 text-sky" aria-hidden />
        <div>
          <h2 className="font-heading text-2xl font-bold text-charcoal">{labels.calendarTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate">{labels.calendarSubtitle}</p>
        </div>
      </header>

      <div className="relative mt-6">
        {!ready ? (
          <div className="space-y-3 py-2" aria-live="polite">
            <span className="sr-only">{labels.calendarSubtitle}</span>
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="grid gap-2 sm:grid-cols-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          </div>
        ) : null}
        <div
          id={FLIGHT_PRICE_WIDGET_MOUNT_ID}
          ref={mountRef}
          className={cn("flight-price-widget-mount", !ready && "min-h-[160px]")}
          aria-busy={!ready}
        />
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-slate">{labels.calendarDisclaimer}</p>

      <Link
        href={searchHref}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "mt-4 rounded-full border-sky/30 text-sky hover:bg-sky/5",
        )}
      >
        {labels.searchCta}
      </Link>
    </section>
  );
}
