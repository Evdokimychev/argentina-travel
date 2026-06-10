"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { MegaMenuPanel, NavBadge } from "@/components/navigation/MegaMenuPanel";
import { GuideMegaMenuPanel } from "@/components/navigation/GuideMegaMenuPanel";
import { cn } from "@/lib/cn";
import { navSectionLabel } from "@/lib/site-nav";
import type { NavTranslate } from "@/lib/site-nav";
import type { SiteNavSection } from "@/types/site-nav";

const CLOSE_DELAY_MS = 350;

export function MegaMenuTrigger({
  section,
  index,
  active,
  t,
  open,
  onOpenChange,
}: {
  section: SiteNavSection;
  index: number;
  active: boolean;
  t: NavTranslate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const label = navSectionLabel(section, t);
  const num = String(index).padStart(2, "0");

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    clearCloseTimer();
    onOpenChange(true);
  }, [clearCloseTimer, onOpenChange]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => onOpenChange(false), CLOSE_DELAY_MS);
  }, [clearCloseTimer, onOpenChange]);

  const closeMenu = useCallback(() => {
    clearCloseTimer();
    onOpenChange(false);
  }, [clearCloseTimer, onOpenChange]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeMenu]);

  if (!section.columns?.length && section.href) {
    return (
      <Link
        href={section.href}
        className={cn(
          "group relative inline-flex items-baseline gap-1 px-1 py-1 text-sm font-medium transition-colors",
          active ? "text-sky" : "text-foreground/70 hover:text-sky"
        )}
      >
        {label}
        <sup className="text-[10px] font-normal text-gray-400 group-hover:text-sky/70">{num}</sup>
      </Link>
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => (open ? closeMenu() : openMenu())}
        className={cn(
          "group relative inline-flex items-center gap-0.5 px-1 py-1 text-sm font-medium transition-colors",
          active || open ? "text-sky" : "text-foreground/70 hover:text-sky"
        )}
      >
        {label}
        {section.badge ? <NavBadge badge={section.badge} /> : null}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
        <sup className="ml-0.5 text-[10px] font-normal text-gray-400 group-hover:text-sky/70">
          {num}
        </sup>
      </button>

      {open ? (
        <div
          className={cn(
            "absolute left-1/2 top-full z-[110] -translate-x-1/2",
            section.id === "guide"
              ? "w-[min(calc(100vw-2rem),64rem)]"
              : "w-[min(calc(100vw-2rem),56rem)]"
          )}
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
        >
          <div className="h-4 w-full" aria-hidden />
          <div className="rounded-2xl border border-border-subtle bg-surface-elevated shadow-modal">
            {section.id === "guide" ? (
              <GuideMegaMenuPanel
                columns={section.columns ?? []}
                t={t}
                onNavigate={closeMenu}
              />
            ) : (
              <MegaMenuPanel
                columns={section.columns ?? []}
                t={t}
                onNavigate={closeMenu}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
