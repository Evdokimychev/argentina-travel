"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { safeClearElementContent, safeRemoveElement } from "@/lib/dom/safe-partner-dom";
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

type InsuranceWidgetStatus = "loading" | "ready" | "error" | "timeout";

const WIDGET_SYNC_RETRY_MS = [100, 500, 1500, 3000, 6000, 10_000];
const WIDGET_READY_TIMEOUT_MS = 12_000;
const INSURANCE_FALLBACK_URL = "https://cherehapa.ru/";

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
  const [status, setStatus] = useState<InsuranceWidgetStatus>("loading");
  const [retryKey, setRetryKey] = useState(0);

  const retryWidget = useCallback(() => {
    setStatus("loading");
    setRetryKey((value) => value + 1);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (!scriptUrl) {
      setStatus("error");
      return;
    }

    const abortController = new AbortController();
    let disposed = false;
    const syncTimers: number[] = [];
    let readyTimeout = 0;

    function markReady() {
      if (disposed) return;
      setStatus("ready");
      window.clearTimeout(readyTimeout);
    }

    function markError() {
      if (disposed) return;
      setStatus("error");
      window.clearTimeout(readyTimeout);
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
      }, { signal: abortController.signal });
      script.addEventListener("error", markError, { signal: abortController.signal });
      scriptMount.appendChild(script);
    }

    injectScript();

    const observer = new MutationObserver(syncWidgetRoot);
    observer.observe(mount, { childList: true, subtree: true });

    syncWidgetRoot();
    for (const delay of WIDGET_SYNC_RETRY_MS) {
      syncTimers.push(window.setTimeout(syncWidgetRoot, delay));
    }
    readyTimeout = window.setTimeout(() => {
      if (disposed) return;
      syncWidgetRoot();
      if (!mountHasWidgetContent(mount)) setStatus("timeout");
    }, WIDGET_READY_TIMEOUT_MS);

    return () => {
      disposed = true;
      abortController.abort();
      observer.disconnect();
      window.clearTimeout(readyTimeout);
      for (const timer of syncTimers) window.clearTimeout(timer);
      safeRemoveElement(document.getElementById(INSURANCE_WL_SCRIPT_ID));
      safeRemoveElement(findWidgetRoot());
      safeClearElementContent(mount);
    };
  }, [retryKey, scriptUrl]);

  const unavailable = status === "error" || status === "timeout";
  const errorTitle =
    status === "timeout"
      ? "Форма страхования загружается дольше обычного"
      : "Форма страхования временно не загрузилась";
  const errorDescription =
    status === "timeout"
      ? "Проверьте соединение и попробуйте ещё раз или откройте подбор страховки напрямую у партнёра."
      : "Попробуйте загрузить форму ещё раз или продолжите подбор напрямую у партнёра.";

  return (
    <div
      id={INSURANCE_WL_PAGE_MOUNT_ID}
      data-widget-status={status}
      className={cn("insurance-wl-root", className)}
    >
      <div
        ref={mountRef}
        className="insurance-wl-mount"
        aria-busy={status === "loading"}
      >
        {status === "loading" ? (
          <div className="px-4 py-5 sm:px-5 sm:py-6" aria-live="polite">
            <span className="sr-only">{loadingLabel}</span>
            <div className="space-y-3">
              <Skeleton className="h-11 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Skeleton className="h-11 rounded-xl" />
                <Skeleton className="h-11 rounded-xl" />
                <Skeleton className="col-span-2 h-11 rounded-xl sm:col-span-1" />
              </div>
              <Skeleton className="h-12 w-full rounded-xl sm:max-w-[220px]" />
            </div>
          </div>
        ) : null}
        {unavailable ? (
          <div className="insurance-wl-unavailable px-4 py-7 text-center sm:px-6 sm:py-8" role="alert">
            <p className="font-heading text-base font-semibold text-foreground sm:text-lg">
              {errorTitle}
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted">
              {errorDescription}
            </p>
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <button
                type="button"
                onClick={retryWidget}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-sky-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2"
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                Повторить
              </button>
              <a
                href={INSURANCE_FALLBACK_URL}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-subtle bg-white px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2"
              >
                Открыть Cherehapa
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Ссылка откроется в новой вкладке на сайте страхового партнёра.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
