"use client";

import { useEffect, useRef, useState } from "react";
import {
  INSURANCE_WL_MOUNT_ID,
  INSURANCE_WL_PAGE_MOUNT_ID,
  INSURANCE_WL_ROOT_ID,
  INSURANCE_WL_SCRIPT_ID,
  INSURANCE_WL_SCRIPT_MOUNT_ID,
} from "@/lib/travelpayouts/whitelabel/insurance-dom-ids";
import { cn } from "@/lib/utils";
import "./insurance-whitelabel-widget.css";

type InsuranceWhitelabelWidgetProps = {
  scriptUrl: string;
  loadingLabel: string;
  className?: string;
};

function findWidgetRoot(): HTMLElement | null {
  return document.getElementById(INSURANCE_WL_MOUNT_ID);
}

function normalizeWidgetRoot(root: HTMLElement, mount: HTMLElement) {
  if (!mount.contains(root)) {
    const scriptMount =
      mount.querySelector<HTMLElement>(`#${INSURANCE_WL_SCRIPT_MOUNT_ID}`) ?? mount;
    scriptMount.insertBefore(root, scriptMount.firstChild);
  }

  root.style.position = "relative";
  root.style.top = "auto";
  root.style.left = "auto";
  root.style.right = "auto";
  root.style.width = "100%";
  root.style.maxWidth = "100%";
  root.style.minHeight = "0";
  root.style.margin = "0";

  const cherehapaRoot = root.querySelector<HTMLElement>(`#${INSURANCE_WL_ROOT_ID}`);
  if (cherehapaRoot) {
    cherehapaRoot.style.minHeight = "0";
    cherehapaRoot.style.height = "auto";
  }
}

function mountHasWidgetContent(mount: HTMLElement): boolean {
  const root = findWidgetRoot();
  if (!root || !mount.contains(root)) return false;
  return root.offsetHeight > 120;
}

export default function InsuranceWhitelabelWidget({
  scriptUrl,
  loadingLabel,
  className,
}: InsuranceWhitelabelWidgetProps) {
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

      const root = findWidgetRoot();
      if (root) {
        normalizeWidgetRoot(root, mount);
        if (root.offsetHeight > 120) markReady();
        return;
      }

      if (mountHasWidgetContent(mount)) markReady();
    }

    function injectScript() {
      if (!mount) return;

      let scriptMount = mount.querySelector<HTMLElement>(`#${INSURANCE_WL_SCRIPT_MOUNT_ID}`);
      if (!scriptMount) {
        scriptMount = document.createElement("div");
        scriptMount.id = INSURANCE_WL_SCRIPT_MOUNT_ID;
        scriptMount.className = "insurance-wl-script-mount";
        mount.appendChild(scriptMount);
      }

      if (scriptMount.querySelector(`#${INSURANCE_WL_SCRIPT_ID}`)) {
        syncWidgetRoot();
        return;
      }

      const script = document.createElement("script");
      script.id = INSURANCE_WL_SCRIPT_ID;
      script.async = true;
      script.charset = "utf-8";
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
    observer.observe(document.body, { childList: true, subtree: true });

    const interval = window.setInterval(syncWidgetRoot, 300);
    const stopInterval = window.setTimeout(() => window.clearInterval(interval), 60000);

    syncWidgetRoot();

    return () => {
      disposed = true;
      observer.disconnect();
      window.clearInterval(interval);
      window.clearTimeout(stopInterval);
    };
  }, [scriptUrl]);

  return (
    <div
      id={INSURANCE_WL_PAGE_MOUNT_ID}
      ref={mountRef}
      className={cn("insurance-wl-mount relative w-full", className)}
    >
      {!ready ? (
        <p className="px-4 py-3 text-sm text-slate" aria-live="polite">
          {loadingLabel}
        </p>
      ) : null}
    </div>
  );
}
