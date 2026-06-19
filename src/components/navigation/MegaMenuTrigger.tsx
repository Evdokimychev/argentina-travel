"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { MegaMenuDropdown } from "@/components/navigation/MegaMenuDropdown";
import {
  MegaMenuSectionContent,
  megaMenuWidthClass,
} from "@/components/navigation/mega-menu-section-content";
import { NavBadge } from "@/components/navigation/MegaMenuPanel";
import {
  navMegaMenuIndexClassName,
  navMegaMenuTriggerClassName,
} from "@/components/navigation/nav-mega-menu-trigger-styles";
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
  showIndex = true,
  compact = false,
}: {
  section: SiteNavSection;
  index: number;
  active: boolean;
  t: NavTranslate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showIndex?: boolean;
  compact?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const label = navSectionLabel(section, t);
  const num = String(index).padStart(2, "0");
  const indexClassName = navMegaMenuIndexClassName(compact);

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
      const target = event.target as Node;
      const root = rootRef.current;
      const panel = panelRef.current;
      if (root?.contains(target) || panel?.contains(target)) return;
      closeMenu();
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
          navMegaMenuTriggerClassName,
          "shrink-0",
          active ? "text-sky" : "text-foreground/70 hover:text-sky"
        )}
      >
        <span className="truncate">{label}</span>
        {showIndex ? <sup className={indexClassName}>{num}</sup> : null}
      </Link>
    );
  }

  const hasHubLink = Boolean(section.href && section.columns?.length);

  return (
    <div
      ref={rootRef}
      className="relative shrink-0"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      {hasHubLink ? (
        <div
          className={cn(
            navMegaMenuTriggerClassName,
            active || open ? "text-sky" : "text-foreground/70"
          )}
        >
          <Link
            href={section.href!}
            className="inline-flex min-w-0 items-baseline gap-0.5 truncate transition-colors hover:text-sky"
          >
            <span className="truncate">{label}</span>
            {showIndex ? <sup className={indexClassName}>{num}</sup> : null}
          </Link>
          {section.badge ? <NavBadge badge={section.badge} /> : null}
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="true"
            aria-label={`${label}: подменю`}
            onClick={() => (open ? closeMenu() : openMenu())}
            className="rounded-md p-0.5 transition-colors hover:bg-sky/10 hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                open && "rotate-180"
              )}
              aria-hidden
            />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => (open ? closeMenu() : openMenu())}
          className={cn(
            navMegaMenuTriggerClassName,
            active || open ? "text-sky" : "text-foreground/70 hover:text-sky"
          )}
        >
          <span className="truncate">{label}</span>
          {section.badge ? <NavBadge badge={section.badge} /> : null}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
              open && "rotate-180"
            )}
            aria-hidden
          />
          {showIndex ? <sup className={indexClassName}>{num}</sup> : null}
        </button>
      )}

      <MegaMenuDropdown
        open={open}
        triggerRef={rootRef}
        panelRef={panelRef}
        widthClass={megaMenuWidthClass(section.id)}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
      >
        <MegaMenuSectionContent section={section} t={t} onNavigate={closeMenu} />
      </MegaMenuDropdown>
    </div>
  );
}
