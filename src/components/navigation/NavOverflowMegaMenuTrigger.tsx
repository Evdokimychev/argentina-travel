"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { MegaMenuDropdown } from "@/components/navigation/MegaMenuDropdown";
import {
  MegaMenuSectionContent,
  megaMenuWidthClass,
} from "@/components/navigation/mega-menu-section-content";
import { NavBadge } from "@/components/navigation/MegaMenuPanel";
import { navOverflowTriggerClassName } from "@/components/navigation/nav-mega-menu-trigger-styles";
import { getSiteNavSectionIcon } from "@/data/site-nav-mobile";
import { SITE_NAV_SECTIONS } from "@/data/site-nav";
import { useMegaMenuHoverIntent } from "@/hooks/useMegaMenuHoverIntent";
import { cn } from "@/lib/cn";
import { getActiveNavSectionId, isNavSectionActive, navSectionLabel } from "@/lib/site-nav";
import type { NavTranslate } from "@/lib/site-nav";
import type { SiteNavSection } from "@/types/site-nav";

function overflowTriggerLabel(t: NavTranslate): string {
  const translated = t("nav.more");
  return translated === "nav.more" ? "Ещё" : translated;
}

function overflowSectionPreview(sections: SiteNavSection[], t: NavTranslate, max = 3): string {
  return sections
    .slice(0, max)
    .map((section) => navSectionLabel(section, t))
    .join(" · ");
}

function OverflowMegaMenuPanel({
  sections,
  activeSectionId,
  onActiveSectionChange,
  t,
  onNavigate,
  pathname,
}: {
  sections: SiteNavSection[];
  activeSectionId: string;
  onActiveSectionChange: (sectionId: string) => void;
  t: NavTranslate;
  onNavigate: () => void;
  pathname: string;
}) {
  const activeSection =
    sections.find((section) => section.id === activeSectionId) ?? sections[0];

  if (!activeSection) return null;

  return (
    <div className="flex min-h-[18rem] flex-col lg:flex-row">
      <div className="shrink-0 border-b border-border-subtle lg:w-60 lg:border-b-0 lg:border-r">
        <div className="border-b border-border-subtle/70 px-4 py-3 lg:border-b">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate">
            {overflowTriggerLabel(t)}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate/90">
            {overflowSectionPreview(sections, t, sections.length)}
          </p>
        </div>
        <div
          className="scrollbar-hide flex gap-1 overflow-x-auto p-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:p-3"
          role="tablist"
          aria-label={overflowTriggerLabel(t)}
        >
          {sections.map((section) => {
            const selected = section.id === activeSection.id;
            const label = navSectionLabel(section, t);
            const sectionActive = isNavSectionActive(pathname, section, SITE_NAV_SECTIONS);
            const Icon = getSiteNavSectionIcon(section.id);

            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onActiveSectionChange(section.id)}
                className={cn(
                  "shrink-0 rounded-xl px-3 py-2.5 text-left transition-colors lg:w-full",
                  selected
                    ? "bg-sky text-white shadow-sm"
                    : sectionActive
                      ? "bg-sky/8 text-sky ring-1 ring-sky/20"
                      : "text-charcoal hover:bg-sky/5 hover:text-sky",
                )}
              >
                <span className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      selected ? "bg-white/20 text-white" : "bg-sky/10 text-sky",
                    )}
                    aria-hidden
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="block text-sm font-semibold leading-snug">{label}</span>
                      {section.badge ? <NavBadge badge={section.badge} /> : null}
                    </span>
                    {section.description ? (
                      <span
                        className={cn(
                          "mt-0.5 line-clamp-2 block text-xs leading-relaxed",
                          selected ? "text-white/85" : "text-slate",
                        )}
                      >
                        {section.description}
                      </span>
                    ) : null}
                  </span>
                </span>
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
  active,
  t,
  open,
  onOpenChange,
  compact = false,
}: {
  sections: SiteNavSection[];
  index?: number;
  active: boolean;
  t: NavTranslate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showIndex?: boolean;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "");
  const { rootRef, panelRef, openMenu, scheduleClose, closeMenu, rememberPointer } =
    useMegaMenuHoverIntent(open, onOpenChange);

  const label = overflowTriggerLabel(t);
  const ariaSections = useMemo(
    () => sections.map((section) => navSectionLabel(section, t)).join(", "),
    [sections, t],
  );

  const handleMouseEnter = (event: React.MouseEvent) => {
    rememberPointer(event.clientX, event.clientY);
    openMenu();
  };

  const handleMouseLeave = (event: React.MouseEvent) => {
    rememberPointer(event.clientX, event.clientY);
    scheduleClose();
  };

  useEffect(() => {
    if (!open) return;
    const activeSection = sections.find(
      (section) => getActiveNavSectionId(pathname, SITE_NAV_SECTIONS) === section.id,
    );
    setActiveSectionId(activeSection?.id ?? sections[0]?.id ?? "");
  }, [open, pathname, sections]);

  return (
    <div
      ref={rootRef}
      className="relative shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        id="site-nav-overflow-trigger"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${label}: ${ariaSections}`}
        onClick={() => (open ? closeMenu() : openMenu())}
        className={cn(
          navOverflowTriggerClassName,
          active || open
            ? "bg-sky/5 text-sky ring-1 ring-sky/15"
            : "text-foreground/70 hover:bg-surface-muted/80 hover:text-sky",
        )}
      >
        <span className="shrink-0 font-semibold">{label}</span>
        <span
          className="inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-surface-muted px-1.5 text-[10px] font-semibold tabular-nums text-slate"
          aria-hidden
        >
          {sections.length}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <MegaMenuDropdown
        open={open}
        triggerRef={rootRef}
        panelRef={panelRef}
        widthClass={megaMenuWidthClass(activeSectionId || "more")}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <OverflowMegaMenuPanel
          sections={sections}
          activeSectionId={activeSectionId}
          onActiveSectionChange={setActiveSectionId}
          t={t}
          onNavigate={closeMenu}
          pathname={pathname}
        />
      </MegaMenuDropdown>
    </div>
  );
}
