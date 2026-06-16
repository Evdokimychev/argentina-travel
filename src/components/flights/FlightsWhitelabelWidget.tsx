"use client";

import { useEffect, useRef, useState } from "react";
import {
  TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID,
  TRAVELPAYOUTS_WHITELABEL_TICKETS_CONTAINER_ID,
} from "@/lib/travelpayouts/whitelabel/config";
import {
  FLIGHTS_WL_PAGE_MOUNT_ID,
  FLIGHTS_WL_SCRIPT_ID,
  FLIGHTS_WL_SCRIPT_MOUNT_ID,
} from "@/lib/travelpayouts/whitelabel/flights-dom-ids";
import {
  removeAviasalesInjectedStyles,
  sanitizeAviasalesInjectedStyles,
} from "@/lib/travelpayouts/whitelabel/sanitize-aviasales-styles";
import { cn } from "@/lib/utils";
import "./flights-whitelabel-widget.css";

type FlightsWhitelabelWidgetProps = {
  scriptUrl: string;
  loadingLabel: string;
  className?: string;
};

const WL_CONTAINER_IDS = [
  TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID,
  TRAVELPAYOUTS_WHITELABEL_TICKETS_CONTAINER_ID,
  "tpwl-modals",
] as const;

function normalizeContainer(el: HTMLElement, mount: HTMLElement) {
  if (!mount.contains(el)) {
    mount.insertBefore(el, mount.querySelector(`#${FLIGHTS_WL_SCRIPT_MOUNT_ID}`));
  }

  el.style.position = el.id === "tpwl-modals" ? "absolute" : "relative";
  el.style.top = el.id === "tpwl-modals" ? "0" : "auto";
  el.style.left = el.id === "tpwl-modals" ? "0" : "auto";
  el.style.right = "auto";
  el.style.width = "100%";
  el.style.maxWidth = "100%";
  el.style.minHeight = "0";
  el.style.margin = "0";
}

function syncContainers(mount: HTMLElement) {
  sanitizeAviasalesInjectedStyles();

  for (const id of WL_CONTAINER_IDS) {
    const el = document.getElementById(id);
    if (el) normalizeContainer(el, mount);
  }
}

function mountHasWidgetContent(mount: HTMLElement): boolean {
  const search = document.getElementById(TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID);
  if (!search || !mount.contains(search)) return false;
  return search.offsetHeight > 60 || search.childElementCount > 0;
}

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

    function syncWidgetRoot() {
      if (disposed || !mount) return;
      syncContainers(mount);
      if (mountHasWidgetContent(mount)) markReady();
    }

    function injectScript() {
      if (!mount) return;

      let scriptMount = mount.querySelector<HTMLElement>(`#${FLIGHTS_WL_SCRIPT_MOUNT_ID}`);
      if (!scriptMount) {
        scriptMount = document.createElement("div");
        scriptMount.id = FLIGHTS_WL_SCRIPT_MOUNT_ID;
        scriptMount.className = "flights-wl-script-mount";
        mount.appendChild(scriptMount);
      }

      if (scriptMount.querySelector(`#${FLIGHTS_WL_SCRIPT_ID}`)) {
        syncWidgetRoot();
        return;
      }

      const script = document.createElement("script");
      script.id = FLIGHTS_WL_SCRIPT_ID;
      script.type = "module";
      script.async = true;
      script.src = scriptUrl;
      script.addEventListener("load", () => {
        syncWidgetRoot();
        window.setTimeout(syncWidgetRoot, 100);
        window.setTimeout(syncWidgetRoot, 500);
        window.setTimeout(syncWidgetRoot, 1500);
      });
      script.addEventListener("error", markReady);
      scriptMount.appendChild(script);
    }

    injectScript();

    const observer = new MutationObserver(syncWidgetRoot);
    observer.observe(mount, { childList: true, subtree: true });
    observer.observe(document.head, { childList: true, subtree: true });
    observer.observe(document.body, { childList: true, subtree: true });

    const interval = window.setInterval(syncWidgetRoot, 300);
    const stopInterval = window.setTimeout(() => window.clearInterval(interval), 60000);

    syncWidgetRoot();

    return () => {
      disposed = true;
      observer.disconnect();
      window.clearInterval(interval);
      window.clearTimeout(stopInterval);
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
      <div id={TRAVELPAYOUTS_WHITELABEL_SEARCH_CONTAINER_ID} className="w-full" />
      <div id={TRAVELPAYOUTS_WHITELABEL_TICKETS_CONTAINER_ID} className="mt-4 w-full" />
    </div>
  );
}
