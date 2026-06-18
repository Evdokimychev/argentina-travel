"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { isNavSectionActive, navSectionLabel } from "@/lib/site-nav";
import type { NavTranslate } from "@/lib/site-nav";
import type { SiteNavSection } from "@/types/site-nav";

const CLOSE_DELAY_MS = 350;

function OverflowMegaMenuPanel({
  sections,
  activeSectionId,
  onActiveSectionChange,
  t,
  onNavigate,
}: {
  sections: SiteNavSection[];
  activeSectionId: string;
  onActiveSectionChange: (sectionId: string) => void;
  t: NavTranslate;
  onNavigate: () => void;
}) {
  const activeSection =
    sections.find((section) => section.id === activeSectionId) ?? sections[0];

  if (!activeSection) return null;

  return (
    <div className="flex min-h-[18rem] flex-col lg:flex-row">
      <div className="shrink-0 border-b border-border-subtle lg:w-52 lg:border-b-0 lg:border-r">
        <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-wider text-slate">
          Разделы
        </p>
        <div
          className="scrollbar-hide flex gap-1 overflow-x-auto p-3 lg:flex-col lg:gap-0.5 lg:overflow-visible"
          role="tablist"
          aria-label={t("nav.more")}
        >
          {sections.map((section) => {
            const selected = section.id === activeSection.id;
            const label = navSectionLabel(section, t);
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onActiveSectionChange(section.id)}
                className={cn(
                  "shrink-0 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors lg:w-full",
                  selected
                    ? "bg-sky text-white shadow-sm"
                    : "text-charcoal hover:bg-sky/5 hover:text-sky"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto" role="tabpanel">
        <MegaMenuSectionContent section={activeSection} t={t} onNavigate={onNavigate} />
      </div>
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
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "");

  // Until locale messages hydrate, `t` returns the raw key. Mirror
  // `resolveNavLabel` and fall back to the default-locale label so the visible
  // trigger never flashes the raw "nav.more" key during SSR/pre-hydration.
  const translatedLabel = t("nav.more");
  const label = translatedLabel === "nav.more" ? "Ещё" : translatedLabel;
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
    const activeSection = sections.find((section) => isNavSectionActive(pathname, section));
    setActiveSectionId(activeSection?.id ?? sections[0]?.id ?? "");
  }, [open, pathname, sections]);

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
          navMegaMenuTriggerClassName,
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
        {showIndex ? <sup className={indexClassName}>{num}</sup> : null}
      </button>

      <MegaMenuDropdown
        open={open}
        triggerRef={rootRef}
        panelRef={panelRef}
        widthClass={megaMenuWidthClass(activeSectionId || "more")}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
      >
        <OverflowMegaMenuPanel
          sections={sections}
          activeSectionId={activeSectionId}
          onActiveSectionChange={setActiveSectionId}
          t={t}
          onNavigate={closeMenu}
        />
      </MegaMenuDropdown>
    </div>
  );
}
