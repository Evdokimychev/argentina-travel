"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  Home,
} from "lucide-react";
import { NavBadge } from "@/components/navigation/MegaMenuPanel";
import { MegaMenuServicesFooter } from "@/components/navigation/MegaMenuServicesFooter";
import { SITE_NAV_SECTIONS } from "@/data/site-nav";
import {
  buildMobileNavGroups,
  getSiteNavSectionIcon,
} from "@/data/site-nav-mobile";
import { cn } from "@/lib/cn";
import { getGuideTopicIcon } from "@/lib/guide-nav-icons";
import {
  isNavHrefActive,
  isNavSectionActive,
  navLinkLabel,
  navSectionLabel,
  resolveNavLabel,
} from "@/lib/site-nav";
import type { NavTranslate } from "@/lib/site-nav";
import type { SiteNavColumn, SiteNavLink, SiteNavSection } from "@/types/site-nav";

function MobileNavLinkRow({
  link,
  t,
  pathname,
  onNavigate,
  showIcon = false,
}: {
  link: SiteNavLink;
  t: NavTranslate;
  pathname: string;
  onNavigate: () => void;
  showIcon?: boolean;
}) {
  const active = isNavHrefActive(pathname, link.href);
  const Icon = link.topicSlug ? getGuideTopicIcon(link.topicSlug) : null;

  const className = cn(
    "group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors",
    active
      ? "bg-sky/10 ring-1 ring-sky/20"
      : "hover:bg-surface-elevated/80 active:bg-sky/5",
  );

  const inner = (
    <>
      {showIcon && Icon ? (
        <span
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            active ? "bg-sky text-white" : "bg-sky/10 text-sky",
          )}
          aria-hidden
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium leading-snug",
              active ? "text-sky" : "text-charcoal group-hover:text-sky",
            )}
          >
            {navLinkLabel(link, t)}
          </span>
          {link.badge ? <NavBadge badge={link.badge} /> : null}
          {link.external ? (
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate" aria-hidden />
          ) : null}
        </span>
        {link.description ? (
          <span className="mt-0.5 line-clamp-1 block text-xs leading-relaxed text-slate">
            {link.description}
          </span>
        ) : null}
      </span>
      {!link.external ? (
        <ChevronRight
          className="mt-1 h-4 w-4 shrink-0 text-slate/40 group-hover:text-sky/70"
          aria-hidden
        />
      ) : null}
    </>
  );

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className={className}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={link.href} onClick={onNavigate} className={className}>
      {inner}
    </Link>
  );
}

function MobileNavColumnBlock({
  column,
  t,
  pathname,
  onNavigate,
  showIcons,
}: {
  column: SiteNavColumn;
  t: NavTranslate;
  pathname: string;
  onNavigate: () => void;
  showIcons: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-muted/30">
      <div className="border-b border-border-subtle bg-surface-elevated/70 px-4 py-2.5">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate">
          {resolveNavLabel({ label: column.title ?? "", labelKey: column.titleKey }, t)}
        </h3>
      </div>
      <div className="divide-y divide-border-subtle/70 p-1">
        {column.links.map((link) => (
          <MobileNavLinkRow
            key={link.id}
            link={link}
            t={t}
            pathname={pathname}
            onNavigate={onNavigate}
            showIcon={showIcons}
          />
        ))}
      </div>
    </section>
  );
}

function MobileNavSectionScreen({
  section,
  pathname,
  t,
  onNavigate,
  onBack,
}: {
  section: SiteNavSection;
  pathname: string;
  t: NavTranslate;
  onNavigate: () => void;
  onBack: () => void;
}) {
  const label = navSectionLabel(section, t);
  const showGuideIcons = section.id === "guide" || section.id === "immigration";

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-3 mb-3 flex items-center gap-2 border-b border-border-subtle/80 bg-surface-elevated/95 px-3 pb-2.5 pt-0 backdrop-blur-md sm:-mx-4 sm:px-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-sm font-medium text-slate transition-colors hover:bg-sky/5 hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          <span className="sr-only sm:not-sr-only">Назад</span>
        </button>
        <h2 className="min-w-0 flex-1 truncate font-heading text-base font-bold text-charcoal">
          {label}
        </h2>
        {section.href ? (
          <Link
            href={section.href}
            onClick={onNavigate}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-sky transition-colors hover:bg-sky/5"
          >
            Раздел
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>

      {(section.columns ?? []).length > 0 ? (
        <div className="space-y-3">
          {(section.columns ?? []).map((column) => (
            <MobileNavColumnBlock
              key={column.id}
              column={column}
              t={t}
              pathname={pathname}
              onNavigate={onNavigate}
              showIcons={showGuideIcons}
            />
          ))}
          {section.id !== "services" ? (
            <MegaMenuServicesFooter t={t} onNavigate={onNavigate} className="rounded-xl border border-border-subtle bg-surface-muted/20 px-4 py-3" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MobileNavSectionRow({
  section,
  pathname,
  t,
  onOpen,
  onNavigate,
}: {
  section: SiteNavSection;
  pathname: string;
  t: NavTranslate;
  onOpen: () => void;
  onNavigate: () => void;
}) {
  const label = navSectionLabel(section, t);
  const Icon = getSiteNavSectionIcon(section.id);
  const active = isNavSectionActive(pathname, section, SITE_NAV_SECTIONS);
  const hasColumns = (section.columns?.length ?? 0) > 0;

  const rowClass = cn(
    "group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
    active
      ? "border-sky/35 bg-sky/5"
      : "border-border-subtle bg-surface-elevated/60 hover:border-sky/25 hover:bg-surface-elevated active:scale-[0.99]",
  );

  const content = (
    <>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
          active ? "bg-sky text-white" : "bg-sky/10 text-sky group-hover:bg-sky/15",
        )}
        aria-hidden
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold", active ? "text-sky" : "text-charcoal")}>
            {label}
          </span>
          {section.badge ? <NavBadge badge={section.badge} /> : null}
        </span>
      </span>
      {hasColumns ? (
        <ChevronRight
          className="h-5 w-5 shrink-0 text-slate/45 transition-transform group-hover:translate-x-0.5 group-hover:text-sky"
          aria-hidden
        />
      ) : (
        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate/45 group-hover:text-sky" aria-hidden />
      )}
    </>
  );

  if (hasColumns) {
    return (
      <button type="button" onClick={onOpen} className={rowClass}>
        {content}
      </button>
    );
  }

  if (!section.href) {
    return (
      <button type="button" onClick={onOpen} className={rowClass}>
        {content}
      </button>
    );
  }

  return (
    <Link href={section.href} onClick={onNavigate} className={rowClass}>
      {content}
    </Link>
  );
}

function MobileNavRoot({
  pathname,
  t,
  onNavigate,
  onOpenSection,
}: {
  pathname: string;
  t: NavTranslate;
  onNavigate: () => void;
  onOpenSection: (sectionId: string) => void;
}) {
  const groups = buildMobileNavGroups();

  return (
    <div className="space-y-5">
      <Link
        href="/"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
          pathname === "/"
            ? "border-sky/35 bg-sky/5"
            : "border-border-subtle bg-surface-elevated/60 hover:border-sky/25 hover:bg-surface-elevated",
        )}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-charcoal/5 text-charcoal">
          <Home className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="flex-1 text-sm font-semibold text-charcoal">Главная</span>
        <ChevronRight className="h-4 w-4 text-slate/45" aria-hidden />
      </Link>

      {groups.map((group, groupIndex) => (
        <section key={group.id} aria-labelledby={`mobile-nav-group-${group.id}`}>
          {groupIndex > 0 ? (
            <div className="mb-3 border-t border-border-subtle/80" aria-hidden />
          ) : null}
          <div className="mb-2 px-0.5">
            <h2
              id={`mobile-nav-group-${group.id}`}
              className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate"
            >
              {group.label}
            </h2>
          </div>
          <div className="space-y-1.5">
            {group.sections.map((section) => (
              <MobileNavSectionRow
                key={section.id}
                section={section}
                pathname={pathname}
                t={t}
                onOpen={() => onOpenSection(section.id)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function MobileSiteNavMenu({
  sections,
  pathname,
  t,
  open,
  onNavigate,
  scrollContainerRef,
}: {
  sections: SiteNavSection[];
  pathname: string;
  t: NavTranslate;
  open: boolean;
  onNavigate: () => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setActiveSectionId(null);
    }
  }, [open]);

  useEffect(() => {
    setActiveSectionId(null);
  }, [pathname]);

  useEffect(() => {
    scrollContainerRef?.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [activeSectionId, scrollContainerRef]);

  const activeSection =
    activeSectionId != null
      ? sections.find((section) => section.id === activeSectionId)
      : undefined;

  if (activeSection) {
    return (
      <MobileNavSectionScreen
        section={activeSection}
        pathname={pathname}
        t={t}
        onNavigate={onNavigate}
        onBack={() => setActiveSectionId(null)}
      />
    );
  }

  return (
    <MobileNavRoot
      pathname={pathname}
      t={t}
      onNavigate={onNavigate}
      onOpenSection={setActiveSectionId}
    />
  );
}
