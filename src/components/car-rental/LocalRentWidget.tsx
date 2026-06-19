"use client";

import { useEffect, useRef, useState } from "react";
import {
  getLocalRentScriptUrl,
  LOCALRENT_AFFILIATE_ID,
  LOCALRENT_CITY_ID,
  LOCALRENT_COUNTRY_ID,
  LOCALRENT_WIDGET_ROUTING,
  LOCALRENT_WIDGET_Z_INDEX,
} from "@/lib/localrent/config";
import { cn } from "@/lib/utils";
import "./localrent-widget.css";

const SCRIPT_ID = "localrent-wl-app";
const WIDGET_ROOT_ID = "mrc_wl_plhcrd";
export const LOCALRENT_MOUNT_ID = "localrent-wl-mount";

type LocalRentWidgetProps = {
  loadingLabel: string;
  className?: string;
};

function findWidgetRoot(): HTMLElement | null {
  const byId = document.getElementById(WIDGET_ROOT_ID);
  if (byId) return byId;

  const byPrefix = document.querySelector<HTMLElement>('[id^="mrc_wl"]');
  return byPrefix;
}

function normalizeWidgetRoot(root: HTMLElement, mount: HTMLElement) {
  if (!mount.contains(root)) {
    mount.appendChild(root);
  }

  root.style.position = "relative";
  root.style.top = "auto";
  root.style.left = "auto";
  root.style.right = "auto";
  root.style.width = "100%";
  root.style.maxWidth = "100%";
  root.style.margin = "0";
}

function mountHasWidgetContent(mount: HTMLElement): boolean {
  return Array.from(mount.children).some((child) => {
    if (child.id === SCRIPT_ID) return false;
    if (child.getAttribute("data-localrent-loading") === "true") return false;
    return child.tagName !== "SCRIPT";
  });
}

export default function LocalRentWidget({ loadingLabel, className }: LocalRentWidgetProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;

    function markReady() {
      if (!disposed) setReady(true);
    }

    function syncWidgetRoot() {
      if (disposed || !mount) return;

      const root = findWidgetRoot();
      if (root) {
        normalizeWidgetRoot(root, mount);
        markReady();
        return;
      }

      if (mountHasWidgetContent(mount)) {
        markReady();
      }
    }

    function injectScript() {
      if (!mount) return;
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = getLocalRentScriptUrl();
      script.async = true;
      script.dataset.mrcWl = "true";
      script.dataset.affiliate = LOCALRENT_AFFILIATE_ID;
      script.dataset.country = LOCALRENT_COUNTRY_ID;
      script.dataset.city = LOCALRENT_CITY_ID;
      script.dataset.routing = LOCALRENT_WIDGET_ROUTING;
      script.dataset.zindex = LOCALRENT_WIDGET_Z_INDEX;

      script.addEventListener("load", () => {
        syncWidgetRoot();
        window.setTimeout(syncWidgetRoot, 100);
        window.setTimeout(syncWidgetRoot, 500);
      });
      script.addEventListener("error", markReady);

      mount.appendChild(script);
    }

    const existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) {
      if (!mount.contains(existingScript)) {
        mount.appendChild(existingScript);
      }
      syncWidgetRoot();
    } else {
      injectScript();
    }

    const observer = new MutationObserver(syncWidgetRoot);
    observer.observe(document.body, { childList: true, subtree: true });

    const interval = window.setInterval(syncWidgetRoot, 200);
    const stopInterval = window.setTimeout(() => window.clearInterval(interval), 20000);

    syncWidgetRoot();

    return () => {
      disposed = true;
      observer.disconnect();
      window.clearInterval(interval);
      window.clearTimeout(stopInterval);
    };
  }, []);

  return (
    <div
      id={LOCALRENT_MOUNT_ID}
      ref={mountRef}
      className={cn("localrent-wl-mount relative w-full", className)}
      data-mrc-wl="true"
      data-affiliate={LOCALRENT_AFFILIATE_ID}
      data-country={LOCALRENT_COUNTRY_ID}
      data-city={LOCALRENT_CITY_ID}
      data-routing={LOCALRENT_WIDGET_ROUTING}
      data-zindex={LOCALRENT_WIDGET_Z_INDEX}
    >
      {!ready ? (
        <p
          className="mb-3 text-sm text-slate"
          data-localrent-loading="true"
          aria-live="polite"
        >
          {loadingLabel}
        </p>
      ) : null}
    </div>
  );
}
