"use client";

import { useRef } from "react";
import { MegaMenuTrigger } from "@/components/navigation/MegaMenuTrigger";
import { NavOverflowMegaMenuTrigger } from "@/components/navigation/NavOverflowMegaMenuTrigger";
import { useSiteNavLayout } from "@/hooks/useSiteNavLayout";
import { isNavSectionActive } from "@/lib/site-nav";
import type { NavTranslate } from "@/lib/site-nav";

type DesktopSiteNavProps = {
  pathname: string;
  t: NavTranslate;
  openMegaMenuId: string | null;
  onOpenMegaMenuChange: (id: string | null) => void;
};

export default function DesktopSiteNav({
  pathname,
  t,
  openMegaMenuId,
  onOpenMegaMenuChange,
}: DesktopSiteNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const {
    primarySections,
    overflowSections,
    showNavIndex,
    navCompact,
    registerItemRef,
  } = useSiteNavLayout(navRef);

  const overflowNavActive = overflowSections.some((section) =>
    isNavSectionActive(pathname, section),
  );

  return (
    <nav
      ref={navRef}
      className="hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden lg:flex xl:gap-1.5 2xl:gap-2"
      aria-label={t("nav.main")}
    >
      {primarySections.map((section, index) => (
        <div
          key={section.id}
          ref={registerItemRef(section.id)}
          className="max-w-[9.5rem] shrink-0 2xl:max-w-none"
        >
          <MegaMenuTrigger
            section={section}
            index={index + 1}
            active={isNavSectionActive(pathname, section)}
            t={t}
            open={openMegaMenuId === section.id}
            showIndex={showNavIndex}
            compact={navCompact}
            onOpenChange={(nextOpen) => {
              if (nextOpen) {
                onOpenMegaMenuChange(section.id);
                return;
              }
              onOpenMegaMenuChange(openMegaMenuId === section.id ? null : openMegaMenuId);
            }}
          />
        </div>
      ))}

      {overflowSections.length > 0 ? (
        <div ref={registerItemRef("overflow")} className="shrink-0">
          <NavOverflowMegaMenuTrigger
            sections={overflowSections}
            active={overflowNavActive}
            t={t}
            open={openMegaMenuId === "more"}
            compact={navCompact}
            onOpenChange={(nextOpen) => {
              if (nextOpen) {
                onOpenMegaMenuChange("more");
                return;
              }
              onOpenMegaMenuChange(openMegaMenuId === "more" ? null : openMegaMenuId);
            }}
          />
        </div>
      ) : null}
    </nav>
  );
}
