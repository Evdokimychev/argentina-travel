"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { getSiteNavSection } from "@/data/site-nav";
import { cn } from "@/lib/cn";
import { isNavHrefActive, navLinkLabel, resolveNavLabel } from "@/lib/site-nav";
import { siteContainerClass } from "@/lib/site-container";

const GUIDE_SITE_NAV = getSiteNavSection("guide")!;

export default function GuideSectionNav() {
  const pathname = usePathname();
  const { t } = useLocaleCurrency();
  const columns = GUIDE_SITE_NAV.columns ?? [];

  return (
    <nav
      className="sticky top-[var(--site-header-height,0px)] z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md"
      aria-label="Разделы путеводителя"
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
                  const active = isNavHrefActive(pathname, link.href);
                  return (
                    <li key={link.id}>
                      <Link
                        href={link.href}
                        className={cn(
                          "inline-flex rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                          active
                            ? "border-sky/30 bg-sky/10 text-sky"
                            : "border-gray-200 bg-white text-foreground/80 hover:border-sky/30 hover:bg-sky/5 hover:text-sky"
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
