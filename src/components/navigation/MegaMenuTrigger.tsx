"use client";

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
import { useMegaMenuHoverIntent } from "@/hooks/useMegaMenuHoverIntent";
import { cn } from "@/lib/cn";
import { navSectionLabel } from "@/lib/site-nav";
import type { NavTranslate } from "@/lib/site-nav";
import type { SiteNavSection } from "@/types/site-nav";

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
  const { rootRef, panelRef, openMenu, scheduleClose, closeMenu, rememberPointer } =
    useMegaMenuHoverIntent(open, onOpenChange);

  const label = navSectionLabel(section, t);
  const num = String(index).padStart(2, "0");
  const indexClassName = navMegaMenuIndexClassName(compact);

  if (!section.columns?.length && section.href) {
    return (
      <Link
        href={section.href}
        className={cn(
          navMegaMenuTriggerClassName,
          "shrink-0",
          active ? "text-sky" : "text-foreground/70 hover:text-sky",
        )}
      >
        <span className="truncate">{label}</span>
        {showIndex ? <sup className={indexClassName}>{num}</sup> : null}
      </Link>
    );
  }

  const hasHubLink = Boolean(section.href && section.columns?.length);

  const handleMouseEnter = (event: React.MouseEvent) => {
    rememberPointer(event.clientX, event.clientY);
    openMenu();
  };

  const handleMouseLeave = (event: React.MouseEvent) => {
    rememberPointer(event.clientX, event.clientY);
    scheduleClose();
  };

  return (
    <div
      ref={rootRef}
      className="relative shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {hasHubLink ? (
        <div
          className={cn(
            navMegaMenuTriggerClassName,
            active || open ? "text-sky" : "text-foreground/70",
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
                open && "rotate-180",
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
            active || open ? "text-sky" : "text-foreground/70 hover:text-sky",
          )}
        >
          <span className="truncate">{label}</span>
          {section.badge ? <NavBadge badge={section.badge} /> : null}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
              open && "rotate-180",
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
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <MegaMenuSectionContent section={section} t={t} onNavigate={closeMenu} />
      </MegaMenuDropdown>
    </div>
  );
}
