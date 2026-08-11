"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { MegaMenuDropdown } from "@/components/navigation/MegaMenuDropdown";
import {
  MegaMenuSectionContent,
  megaMenuWidthClass,
} from "@/components/navigation/mega-menu-section-content";
import { NavBadge } from "@/components/navigation/MegaMenuPanel";
import {
  navMegaMenuChevronButtonClassName,
  navMegaMenuChevronClassName,
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const label = navSectionLabel(section, t);
  const num = String(index).padStart(2, "0");
  const indexClassName = navMegaMenuIndexClassName(compact);
  const panelId = `site-mega-menu-${section.id}`;

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [
        ...panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeMenu, open, panelRef]);

  const openFromControl = () => {
    openMenu();
    window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
        ?.focus();
    }, 0);
  };

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
        {showIndex ? (
          <span className={indexClassName} aria-hidden>
            {num}
          </span>
        ) : null}
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

  const chevron = (
    <ChevronDown
      className={cn(navMegaMenuChevronClassName, open && "rotate-180 opacity-70")}
      aria-hidden
    />
  );

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
            className="inline-flex min-w-0 items-center gap-1 truncate transition-colors hover:text-sky"
          >
            <span className="truncate">{label}</span>
            {showIndex ? (
              <span className={indexClassName} aria-hidden>
                {num}
              </span>
            ) : null}
          </Link>
          {section.badge ? <NavBadge badge={section.badge} /> : null}
          <button
            ref={menuButtonRef}
            type="button"
            aria-expanded={open}
            aria-haspopup="true"
            aria-controls={panelId}
            aria-label={`${label}: подменю`}
            onClick={() => (open ? closeMenu() : openFromControl())}
            className={navMegaMenuChevronButtonClassName}
          >
            {chevron}
          </button>
        </div>
      ) : (
        <button
          ref={menuButtonRef}
          type="button"
          aria-expanded={open}
          aria-haspopup="true"
          aria-controls={panelId}
          onClick={() => (open ? closeMenu() : openFromControl())}
          className={cn(
            navMegaMenuTriggerClassName,
            active || open ? "text-sky" : "text-foreground/70 hover:text-sky",
          )}
        >
          <span className="truncate">{label}</span>
          {showIndex ? (
            <span className={indexClassName} aria-hidden>
              {num}
            </span>
          ) : null}
          {section.badge ? <NavBadge badge={section.badge} /> : null}
          {chevron}
        </button>
      )}

      <MegaMenuDropdown
        open={open}
        triggerRef={rootRef}
        panelRef={panelRef}
        widthClass={megaMenuWidthClass(section.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        panelId={panelId}
      >
        <MegaMenuSectionContent section={section} t={t} onNavigate={closeMenu} />
      </MegaMenuDropdown>
    </div>
  );
}
