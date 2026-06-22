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

function countSectionLinks(section: SiteNavSection): number {
  return (section.columns ?? []).reduce((sum, column) => sum + column.links.length, 0);
}

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
          <span className="mt-0.5 block text-xs leading-relaxed text-slate">{link.description}</span>
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
  const Icon = getSiteNavSectionIcon(section.id);
  const active = isNavSectionActive(pathname, section);
  const showGuideIcons = section.id === "guide" || section.id === "immigration";
  const linkCount = countSectionLinks(section);

  return (
    <div className="motion-reveal">
      <div className="sticky top-0 z-10 -mx-1 mb-4 border-b border-border-subtle/80 bg-surface-elevated/95 px-1 pb-3 pt-0 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate transition-colors hover:bg-sky/5 hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          Главное меню
        </button>
      </div>

      <div
        className={cn(
          "mb-5 overflow-hidden rounded-2xl border bg-gradient-to-br p-4 sm:p-5",
          active
            ? "border-sky/30 from-sky/15 via-sky/5 to-surface-muted/40"
            : "border-border-subtle from-surface-muted/80 via-surface-muted/40 to-surface-elevated/40",
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
              active ? "bg-sky text-white" : "bg-sky/10 text-sky",
            )}
            aria-hidden
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-lg font-bold leading-tight text-charcoal">{label}</h2>
              {section.badge ? <NavBadge badge={section.badge} /> : null}
            </div>
            {section.description ? (
              <p className="mt-1.5 text-sm leading-relaxed text-slate">{section.description}</p>
            ) : null}
            {linkCount > 0 ? (
              <p className="mt-2 text-xs font-medium text-slate/80">
                {linkCount} {linkCount === 1 ? "пункт" : linkCount < 5 ? "пункта" : "пунктов"}
              </p>
            ) : null}
          </div>
        </div>

        {section.href ? (
          <Link
            href={section.href}
            onClick={onNavigate}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky/90 sm:w-auto"
          >
            Открыть раздел
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>

      {(section.columns ?? []).length > 0 ? (
        <div className="space-y-4">
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
  const active = isNavSectionActive(pathname, section);
  const hasColumns = (section.columns?.length ?? 0) > 0;
  const linkCount = countSectionLinks(section);

  const rowClass = cn(
    "group flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3.5 text-left transition-all",
    active
      ? "border-sky/35 bg-sky/5 shadow-sm shadow-sky/5"
      : "border-border-subtle bg-surface-elevated/60 hover:border-sky/25 hover:bg-surface-elevated active:scale-[0.99]",
  );

  const content = (
    <>
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors",
          active ? "bg-sky text-white" : "bg-sky/10 text-sky group-hover:bg-sky/15",
        )}
        aria-hidden
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold", active ? "text-sky" : "text-charcoal")}>
            {label}
          </span>
          {section.badge ? <NavBadge badge={section.badge} /> : null}
        </span>
        {section.description ? (
          <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate">
            {section.description}
          </span>
        ) : null}
        {hasColumns && linkCount > 0 ? (
          <span className="mt-1 block text-[11px] font-medium text-slate/70">
            {linkCount} {linkCount === 1 ? "ссылка" : linkCount < 5 ? "ссылки" : "ссылок"}
          </span>
        ) : null}
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
    <div className="motion-reveal space-y-7">
      <Link
        href="/"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-2xl border px-3.5 py-3.5 transition-colors",
          pathname === "/"
            ? "border-sky/35 bg-sky/5"
            : "border-border-subtle bg-surface-elevated/60 hover:border-sky/25 hover:bg-surface-elevated",
        )}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-charcoal/5 text-charcoal">
          <Home className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-charcoal">Главная</span>
          <span className="block text-xs text-slate">Туры, регионы и вдохновение для поездки</span>
        </span>
        <ChevronRight className="h-5 w-5 text-slate/45" aria-hidden />
      </Link>

      {groups.map((group, groupIndex) => (
        <section key={group.id} aria-labelledby={`mobile-nav-group-${group.id}`}>
          {groupIndex > 0 ? (
            <div className="mb-5 border-t border-border-subtle/80" aria-hidden />
          ) : null}
          <div className="mb-3 px-1">
            <h2
              id={`mobile-nav-group-${group.id}`}
              className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate"
            >
              {group.label}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate/90">{group.description}</p>
          </div>
          <div className="space-y-2">
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
}: {
  sections: SiteNavSection[];
  pathname: string;
  t: NavTranslate;
  open: boolean;
  onNavigate: () => void;
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
