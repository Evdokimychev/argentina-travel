"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { IMMIGRATION_SITE_NAV } from "@/data/site-nav";
import { useSyncSiteSectionNavHeight } from "@/hooks/useSyncSiteSectionNavHeight";
import { IMMIGRATION_HUB_LINK_ID } from "@/lib/immigration-nav-icons";
import { cn } from "@/lib/cn";
import { isNavHrefActive, navLinkLabel, resolveNavLabel } from "@/lib/site-nav";
import { siteContainerClass } from "@/lib/site-container";
import type { SiteNavLink } from "@/types/site-nav";

function isImmigrationNavLinkActive(pathname: string, link: SiteNavLink): boolean {
  if (link.id === IMMIGRATION_HUB_LINK_ID) {
    return pathname === "/immigration";
  }
  return isNavHrefActive(pathname, link.href);
}

export default function ImmigrationSectionNav() {
  const pathname = usePathname();
  const { t } = useLocaleCurrency();
  const navRef = useRef<HTMLElement>(null);
  const columns = IMMIGRATION_SITE_NAV.columns ?? [];
  useSyncSiteSectionNavHeight(navRef);

  return (
    <nav
      ref={navRef}
      className="sticky top-[var(--site-header-height,0px)] z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md"
      aria-label="Разделы иммиграции"
    >
      <div className={cn(siteContainerClass, "overflow-x-auto py-3")}>
        <div className="flex min-w-max items-start gap-6 sm:gap-8">
          {columns.map((column) => (
            <div key={column.id} className="min-w-0">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate">
                {resolveNavLabel({ label: column.title ?? "", labelKey: column.titleKey }, t)}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {column.links.map((link) => {
                  const active = isImmigrationNavLinkActive(pathname, link);
                  const isHub = link.id === IMMIGRATION_HUB_LINK_ID;

                  return (
                    <li key={link.id}>
                      <Link
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "inline-flex rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                          isHub &&
                            "font-semibold shadow-sm ring-1 ring-sky/10",
                          isHub &&
                            !active &&
                            "border-sky/35 bg-gradient-to-br from-sky/12 via-sky/5 to-white text-charcoal hover:border-sky/45 hover:from-sky/18",
                          isHub &&
                            active &&
                            "border-sky bg-sky text-white shadow-md ring-sky/30",
                          !isHub &&
                            active &&
                            "border-sky/30 bg-sky/10 text-sky",
                          !isHub &&
                            !active &&
                            "border-gray-200 bg-white text-foreground/80 hover:border-sky/30 hover:bg-sky/5 hover:text-sky"
                        )}
                      >
                        {navLinkLabel(link, t)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
