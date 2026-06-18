"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GeographyMegaMenuPanel } from "@/components/navigation/GeographyMegaMenuPanel";
import { ExcursionsMegaMenuPanel } from "@/components/navigation/ExcursionsMegaMenuPanel";
import { GuideMegaMenuPanel } from "@/components/navigation/GuideMegaMenuPanel";
import { ImmigrationMegaMenuPanel } from "@/components/navigation/ImmigrationMegaMenuPanel";
import { MegaMenuPanel } from "@/components/navigation/MegaMenuPanel";
import { ToursMegaMenuPanel } from "@/components/navigation/ToursMegaMenuPanel";
import { navSectionLabel } from "@/lib/site-nav";
import type { NavTranslate } from "@/lib/site-nav";
import type { SiteNavSection } from "@/types/site-nav";

export function megaMenuWidthClass(sectionId: string): string {
  if (sectionId === "guide" || sectionId === "immigration" || sectionId === "more") {
    return "w-[min(calc(100vw-2rem),64rem)]";
  }
  if (sectionId === "geography") {
    return "w-[min(calc(100vw-2rem),64rem)]";
  }
  if (
    sectionId === "tours" ||
    sectionId === "excursions" ||
    sectionId === "services" ||
    sectionId === "journal"
  ) {
    return "w-[min(calc(100vw-2rem),56rem)]";
  }
  return "w-[min(calc(100vw-2rem),48rem)]";
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
      return <MegaMenuPanel columns={columns} t={t} onNavigate={onNavigate} showIcons />;
  }
}
