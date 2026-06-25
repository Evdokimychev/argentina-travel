"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GeographyMegaMenuPanel } from "@/components/navigation/GeographyMegaMenuPanel";
import { ExcursionsMegaMenuPanel } from "@/components/navigation/ExcursionsMegaMenuPanel";
import { GuideMegaMenuPanel } from "@/components/navigation/GuideMegaMenuPanel";
import { ImmigrationMegaMenuPanel } from "@/components/navigation/ImmigrationMegaMenuPanel";
import { MegaMenuPanel } from "@/components/navigation/MegaMenuPanel";
import { MegaMenuServicesFooter } from "@/components/navigation/MegaMenuServicesFooter";
import { ToursMegaMenuPanel } from "@/components/navigation/ToursMegaMenuPanel";
import { navSectionLabel } from "@/lib/site-nav";
import type { NavTranslate } from "@/lib/site-nav";
import type { SiteNavSection } from "@/types/site-nav";
import { megaMenuPanelWidthClass } from "@/lib/responsive-ui";

export function megaMenuWidthClass(sectionId: string): string {
  if (sectionId === "guide" || sectionId === "immigration" || sectionId === "more") {
    return megaMenuPanelWidthClass(64);
  }
  if (sectionId === "geography") {
    return megaMenuPanelWidthClass(64);
  }
  if (
    sectionId === "tours" ||
    sectionId === "excursions" ||
    sectionId === "services" ||
    sectionId === "journal"
  ) {
    return megaMenuPanelWidthClass(56);
  }
  return megaMenuPanelWidthClass(48);
}

function HubOnlySectionPanel({
  section,
  t,
  onNavigate,
}: {
  section: SiteNavSection;
  t: NavTranslate;
  onNavigate: () => void;
}) {
  const label = navSectionLabel(section, t);

  return (
    <div className="flex flex-col">
      <div className="p-5">
        <aside className="flex max-w-lg flex-col rounded-xl bg-gradient-to-br from-sky/10 via-surface-muted/80 to-surface-muted/40 p-5 sm:p-6">
          <h3 className="font-heading text-lg font-bold leading-snug text-charcoal">{label}</h3>
          {section.description ? (
            <p className="mt-2 text-sm leading-relaxed text-slate">{section.description}</p>
          ) : null}
          {section.href ? (
            <Link
              href={section.href}
              onClick={onNavigate}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sky transition-colors hover:text-sky/80"
            >
              Открыть раздел
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
        </aside>
      </div>
      <MegaMenuServicesFooter t={t} onNavigate={onNavigate} />
    </div>
  );
}

export function MegaMenuSectionContent({
  section,
  t,
  onNavigate,
}: {
  section: SiteNavSection;
  t: NavTranslate;
  onNavigate: () => void;
}) {
  const columns = section.columns ?? [];

  if (!columns.length && section.href) {
    return <HubOnlySectionPanel section={section} t={t} onNavigate={onNavigate} />;
  }

  switch (section.id) {
    case "guide":
      return <GuideMegaMenuPanel columns={columns} t={t} onNavigate={onNavigate} />;
    case "immigration":
      return <ImmigrationMegaMenuPanel columns={columns} t={t} onNavigate={onNavigate} />;
    case "geography":
      return <GeographyMegaMenuPanel columns={columns} t={t} onNavigate={onNavigate} />;
    case "tours":
      return <ToursMegaMenuPanel columns={columns} t={t} onNavigate={onNavigate} />;
    case "excursions":
      return <ExcursionsMegaMenuPanel columns={columns} t={t} onNavigate={onNavigate} />;
    default:
      return (
        <div className="flex flex-col">
          <MegaMenuPanel columns={columns} t={t} onNavigate={onNavigate} showIcons />
          {section.id !== "services" ? (
            <MegaMenuServicesFooter t={t} onNavigate={onNavigate} />
          ) : null}
        </div>
      );
  }
}
