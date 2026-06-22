"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/cn";

const AUTO_COLLAPSE_MAX_WIDTH = 1279;

type CollapsibleAsidePanelProps = {
  title: string;
  storageKey: string;
  children: ReactNode;
  collapsedHint?: string;
  defaultCollapsed?: boolean;
  className?: string;
};

function readCollapsed(storageKey: string): boolean {
  try {
    return window.localStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(storageKey: string, value: boolean) {
  try {
    window.localStorage.setItem(storageKey, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export default function CollapsibleAsidePanel({
  title,
  storageKey,
  children,
  collapsedHint,
  defaultCollapsed = false,
  className,
}: CollapsibleAsidePanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    function sync() {
      if (window.innerWidth <= AUTO_COLLAPSE_MAX_WIDTH) {
        setCollapsed(true);
        return;
      }
      setCollapsed(readCollapsed(storageKey));
    }
    sync();
    setHydrated(true);
    window.addEventListener("resize", sync, { passive: true });
    return () => window.removeEventListener("resize", sync);
  }, [storageKey]);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      writeCollapsed(storageKey, next);
      return next;
    });
  }

  if (!hydrated) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-gray-100 bg-white shadow-card",
          collapsed ? "h-12" : "h-32",
          className
        )}
        aria-hidden
      />
    );
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-gray-100 bg-white shadow-card",
        className
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        className="blog-touch-target flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-gray-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
      >
        <span className="min-w-0">
          <span className="block font-heading text-sm font-bold text-charcoal">{title}</span>
          {collapsed && collapsedHint ? (
            <span className="mt-0.5 block truncate text-xs text-slate">{collapsedHint}</span>
          ) : null}
        </span>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate" aria-hidden />
        ) : (
          <ChevronUp className="h-4 w-4 shrink-0 text-slate" aria-hidden />
        )}
      </button>

      {!collapsed ? <div className="border-t border-gray-100 px-4 py-4">{children}</div> : null}
    </section>
  );
}
