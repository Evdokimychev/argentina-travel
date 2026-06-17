"use client";

import { NavMenuLink } from "@/components/navigation/MegaMenuPanel";
import { cn } from "@/lib/cn";
import { navSectionLabel, resolveNavLabel } from "@/lib/site-nav";
import type { NavTranslate } from "@/lib/site-nav";
import type { SiteNavLink, SiteNavSection } from "@/types/site-nav";

function sectionHubLink(section: SiteNavSection, t: NavTranslate): SiteNavLink | null {
  if (!section.href) return null;

  return {
    id: `${section.id}-hub`,
    label: navSectionLabel(section, t),
    labelKey: section.labelKey,
    href: section.href,
    description: section.description,
  };
}

export function NavSectionMenuBlock({
  section,
  t,
  onNavigate,
}: {
  section: SiteNavSection;
  t: NavTranslate;
  onNavigate: () => void;
}) {
  const label = navSectionLabel(section, t);
  const columns = section.columns ?? [];
  const hubLink = sectionHubLink(section, t);

  if (!columns.length) {
    if (!hubLink) return null;

    return (
      <div className="min-w-0">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate">
          {label}
        </p>
        <ul className="space-y-0.5">
          <li>
            <NavMenuLink link={hubLink} t={t} onNavigate={onNavigate} />
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate">
        {label}
      </p>

      {hubLink ? (
        <ul className="mb-3 space-y-0.5 border-b border-border-subtle pb-3">
          <li>
            <NavMenuLink link={hubLink} t={t} onNavigate={onNavigate} />
          </li>
        </ul>
      ) : null}

      <div className={cn("space-y-4", columns.length === 1 && "space-y-0")}>
        {columns.map((column) => (
          <div key={column.id} className="min-w-0">
            {columns.length > 1 ? (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate/75">
                {resolveNavLabel(
                  { label: column.title ?? "", labelKey: column.titleKey },
                  t
                )}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {column.links.map((link) => (
                <li key={link.id}>
                  <NavMenuLink link={link} t={t} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
