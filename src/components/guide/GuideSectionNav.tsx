"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { getSiteNavSection } from "@/data/site-nav";
import { useSyncSiteSectionNavHeight } from "@/hooks/useSyncSiteSectionNavHeight";
import { cn } from "@/lib/cn";
import {
  GUIDE_ABOUT_LINK_ID,
  GUIDE_HUB_LINK_ID,
  getGuideNavColumnIcon,
  getGuideNavLinkIcon,
} from "@/lib/guide-nav-icons";
import { GUIDE_ABOUT_ARGENTINA_PATH } from "@/data/guide-about-argentina";
import { isNavHrefActive, navLinkLabel, resolveNavLabel } from "@/lib/site-nav";
import { siteContainerClass } from "@/lib/site-container";
import type { SiteNavLink } from "@/types/site-nav";

const GUIDE_SITE_NAV = getSiteNavSection("guide")!;

function isGuideNavLinkActive(pathname: string, link: SiteNavLink): boolean {
  if (link.id === GUIDE_HUB_LINK_ID) {
    return pathname === "/guide";
  }
  if (link.id === GUIDE_ABOUT_LINK_ID) {
    return pathname === GUIDE_ABOUT_ARGENTINA_PATH;
  }
  return isNavHrefActive(pathname, link.href);
}

export default function GuideSectionNav() {
  const pathname = usePathname();
  const { t } = useLocaleCurrency();
  const navRef = useRef<HTMLElement>(null);
  const columns = GUIDE_SITE_NAV.columns ?? [];
  useSyncSiteSectionNavHeight(navRef);

  return (
    <nav
      ref={navRef}
      className="sticky top-[var(--site-header-height,0px)] z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md"
      aria-label="Разделы путеводителя"
    >
      <div className={cn(siteContainerClass, "overflow-x-auto py-3")}>
        <div className="flex min-w-max items-start gap-6 sm:gap-8">
          {columns.map((column) => {
            const ColumnIcon = getGuideNavColumnIcon(column.id);
            return (
              <div key={column.id} className="min-w-0">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate">
                  <ColumnIcon className="h-3.5 w-3.5 shrink-0 text-sky/70" aria-hidden />
                  {resolveNavLabel({ label: column.title ?? "", labelKey: column.titleKey }, t)}
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {column.links.map((link) => {
                    const active = isGuideNavLinkActive(pathname, link);
                    const isHub = link.id === GUIDE_HUB_LINK_ID;
                    const isAbout = link.id === GUIDE_ABOUT_LINK_ID;
                    const isFeatured = isHub || isAbout;
                    const LinkIcon = getGuideNavLinkIcon(link);

                    return (
                      <li key={link.id}>
                        <Link
                          href={link.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                            isFeatured &&
                              "font-semibold shadow-sm ring-1 ring-sky/10",
                            isFeatured &&
                              !active &&
                              "border-sky/35 bg-gradient-to-br from-sky/12 via-sky/5 to-white text-charcoal hover:border-sky/45 hover:from-sky/18",
                            isFeatured &&
                              active &&
                              "border-sky bg-sky text-white shadow-md ring-sky/30",
                            !isFeatured &&
                              active &&
                              "border-sky/30 bg-sky/10 font-medium text-sky",
                            !isFeatured &&
                              !active &&
                              "border-gray-200 bg-white font-medium text-foreground/80 hover:border-sky/30 hover:bg-sky/5 hover:text-sky"
                          )}
                        >
                          <LinkIcon
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              isFeatured && active && "text-white",
                              isFeatured && !active && "text-sky",
                              !isFeatured && active && "text-sky",
                              !isFeatured && !active && "text-slate/70"
                            )}
                            aria-hidden
                          />
                          {navLinkLabel(link, t)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
