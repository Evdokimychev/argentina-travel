"use client";

import { useCallback, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { MegaMenuDropdown } from "@/components/navigation/MegaMenuDropdown";
import { NavSectionMenuBlock } from "@/components/navigation/NavSectionMenuBlock";
import { cn } from "@/lib/cn";
import type { NavTranslate } from "@/lib/site-nav";
import type { SiteNavSection } from "@/types/site-nav";

const CLOSE_DELAY_MS = 350;

function OverflowMegaMenuPanel({
  sections,
  t,
  onNavigate,
}: {
  sections: SiteNavSection[];
  t: NavTranslate;
  onNavigate: () => void;
}) {
  return (
    <div className="grid gap-6 p-5 sm:grid-cols-2 xl:grid-cols-3">
      {sections.map((section) => (
        <NavSectionMenuBlock
          key={section.id}
          section={section}
          t={t}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

export function NavOverflowMegaMenuTrigger({
  sections,
  index,
  active,
  t,
  open,
  onOpenChange,
  showIndex = true,
  compact = false,
}: {
  sections: SiteNavSection[];
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

  const label = t("nav.more");
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

  return (
    <div
      ref={rootRef}
      className="relative shrink-0"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        id="site-nav-overflow-trigger"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={label}
        onClick={() => (open ? closeMenu() : openMenu())}
        className={cn(
          "group relative inline-flex max-w-[7.5rem] items-center gap-0.5 truncate px-0.5 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 lg:text-[13px] xl:max-w-none xl:px-1 xl:text-sm",
          active || open ? "text-sky" : "text-foreground/70 hover:text-sky"
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
        {showIndex ? (
          <sup
            className={cn(
              "ml-0.5 text-[10px] font-normal text-gray-400 group-hover:text-sky/70",
              compact && "hidden xl:inline"
            )}
          >
            {num}
          </sup>
        ) : null}
      </button>

      <MegaMenuDropdown
        open={open}
        triggerRef={rootRef}
        panelRef={panelRef}
        widthClass="w-[min(calc(100vw-2rem),56rem)]"
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
      >
        <OverflowMegaMenuPanel sections={sections} t={t} onNavigate={closeMenu} />
      </MegaMenuDropdown>
    </div>
  );
}
