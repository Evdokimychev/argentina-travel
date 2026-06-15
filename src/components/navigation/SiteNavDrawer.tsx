"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import { DestinationsMegaMenuPanel } from "@/components/navigation/DestinationsMegaMenuPanel";
import { GuideMegaMenuPanel } from "@/components/navigation/GuideMegaMenuPanel";
import { ImmigrationMegaMenuPanel } from "@/components/navigation/ImmigrationMegaMenuPanel";
import { MegaMenuPanel, NavBadge } from "@/components/navigation/MegaMenuPanel";
import { ToursMegaMenuPanel } from "@/components/navigation/ToursMegaMenuPanel";
import { cn } from "@/lib/cn";
import {
  isNavHrefActive,
  isNavSectionActive,
  navLinkLabel,
  navSectionLabel,
  resolveNavLabel,
} from "@/lib/site-nav";
import type { NavTranslate } from "@/lib/site-nav";
import type { SiteNavLink, SiteNavSection } from "@/types/site-nav";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function DrawerLink({
  link,
  t,
  pathname,
  onNavigate,
  compact = false,
  showDescription = false,
}: {
  link: SiteNavLink;
  t: NavTranslate;
  pathname: string;
  onNavigate: () => void;
  compact?: boolean;
  showDescription?: boolean;
}) {
  const active = isNavHrefActive(pathname, link.href);
  const className = cn(
    "flex flex-col rounded-xl px-3 py-2.5 text-sm transition-colors",
    active ? "bg-sky/10 font-medium text-sky" : "text-foreground/80 hover:bg-sky/5 hover:text-sky",
    compact && "py-2 text-[13px]"
  );

  const inner = (
    <>
      <span className="flex items-center justify-between gap-2">
        <span>{navLinkLabel(link, t)}</span>
        {link.badge ? <NavBadge badge={link.badge} /> : null}
      </span>
      {showDescription && link.description ? (
        <span className="mt-0.5 text-xs leading-snug text-slate">{link.description}</span>
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

function DrawerSectionColumns({
  section,
  t,
  pathname,
  onNavigate,
}: {
  section: SiteNavSection;
  t: NavTranslate;
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div className="space-y-4 px-1 pb-3 pt-2">
      {section.id === "guide" ? (
        <GuideMegaMenuPanel
          columns={section.columns ?? []}
          t={t}
          onNavigate={onNavigate}
          layout="drawer"
          className="-mx-1"
        />
      ) : section.id === "immigration" ? (
        <ImmigrationMegaMenuPanel
          columns={section.columns ?? []}
          t={t}
          onNavigate={onNavigate}
          layout="drawer"
          className="-mx-1"
        />
      ) : section.id === "destinations" ? (
        <DestinationsMegaMenuPanel
          columns={section.columns ?? []}
          t={t}
          onNavigate={onNavigate}
          layout="drawer"
          className="-mx-1"
        />
      ) : section.id === "tours" ? (
        <ToursMegaMenuPanel
          columns={section.columns ?? []}
          t={t}
          onNavigate={onNavigate}
          layout="drawer"
          className="-mx-1"
        />
      ) : (
        (section.columns ?? []).map((column) => (
          <div key={column.id}>
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate">
              {resolveNavLabel({ label: column.title ?? "", labelKey: column.titleKey }, t)}
            </p>
            <div className="space-y-0.5">
              {column.links.map((link) => (
                <DrawerLink
                  key={link.id}
                  link={link}
                  t={t}
                  pathname={pathname}
                  onNavigate={onNavigate}
                  compact
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function DrawerSection({
  section,
  index,
  pathname,
  t,
  onNavigate,
}: {
  section: SiteNavSection;
  index: number;
  pathname: string;
  t: NavTranslate;
  onNavigate: () => void;
}) {
  const active = isNavSectionActive(pathname, section);
  const label = navSectionLabel(section, t);
  const num = String(index).padStart(2, "0");
  const hasColumns = (section.columns?.length ?? 0) > 0;
  const [expanded, setExpanded] = useState(() => active);

  useEffect(() => {
    if (active) setExpanded(true);
  }, [active]);

  if (section.href && !hasColumns) {
    return (
      <Link
        href={section.href}
        onClick={onNavigate}
        className={cn(
          "group flex items-baseline gap-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          active ? "bg-sky/10 text-sky" : "text-foreground/80 hover:bg-sky/5 hover:text-sky"
        )}
      >
        {label}
        <sup className="text-[10px] font-normal text-gray-400">{num}</sup>
      </Link>
    );
  }

  if (section.href && hasColumns) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border-subtle bg-surface-muted/40",
          expanded && "bg-surface-muted/60"
        )}
      >
        <div className="flex items-center justify-between gap-2 px-3 py-3">
          <Link
            href={section.href}
            onClick={onNavigate}
            className={cn(
              "inline-flex min-w-0 flex-1 items-baseline gap-1 text-sm font-medium transition-colors",
              active ? "text-sky" : "text-foreground hover:text-sky"
            )}
          >
            {label}
            <sup className="text-[10px] font-normal text-gray-400">{num}</sup>
            {section.badge ? <NavBadge badge={section.badge} /> : null}
          </Link>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            aria-label={expanded ? `Свернуть «${label}»` : `Развернуть «${label}»`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate transition-colors hover:bg-sky/5 hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
              aria-hidden
            />
          </button>
        </div>
        {expanded ? (
          <div className="border-t border-border-subtle">
            <DrawerSectionColumns
              section={section}
              t={t}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <details className="group/section rounded-xl border border-border-subtle bg-surface-muted/40 open:bg-surface-muted/60">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-3 text-sm font-medium text-foreground marker:content-none">
        <span className="inline-flex items-baseline gap-1">
          <span className={active ? "text-sky" : undefined}>{label}</span>
          <sup className="text-[10px] font-normal text-gray-400">{num}</sup>
          {section.badge ? <NavBadge badge={section.badge} /> : null}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate transition-transform group-open/section:rotate-180" />
      </summary>
      <div className="border-t border-border-subtle">
        <DrawerSectionColumns section={section} t={t} pathname={pathname} onNavigate={onNavigate} />
      </div>
    </details>
  );
}

export function SiteNavDrawer({
  sections,
  pathname,
  t,
  onNavigate,
}: {
  sections: SiteNavSection[];
  pathname: string;
  t: NavTranslate;
  onNavigate: () => void;
}) {
  return (
    <div className="space-y-2">
      {sections.map((section, index) => (
        <DrawerSection
          key={section.id}
          section={section}
          index={index + 1}
          pathname={pathname}
          t={t}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

export function SiteNavFullMenu({
  sections,
  t,
  onNavigate,
}: {
  sections: SiteNavSection[];
  t: NavTranslate;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <section key={section.id}>
          <div className="mb-3 flex items-center gap-2">
            {section.href ? (
              <Link
                href={section.href}
                onClick={onNavigate}
                className="font-heading text-base font-semibold text-charcoal hover:text-sky"
              >
                {navSectionLabel(section, t)}
              </Link>
            ) : (
              <h3 className="font-heading text-base font-semibold text-charcoal">
                {navSectionLabel(section, t)}
              </h3>
            )}
            {section.badge ? <NavBadge badge={section.badge} /> : null}
          </div>
          {section.columns?.length ? (
            section.id === "guide" ? (
              <GuideMegaMenuPanel
                columns={section.columns}
                t={t}
                onNavigate={onNavigate}
                layout="drawer"
              />
            ) : section.id === "immigration" ? (
              <ImmigrationMegaMenuPanel
                columns={section.columns}
                t={t}
                onNavigate={onNavigate}
                layout="drawer"
              />
            ) : section.id === "destinations" ? (
              <DestinationsMegaMenuPanel
                columns={section.columns}
                t={t}
                onNavigate={onNavigate}
                layout="drawer"
              />
            ) : section.id === "tours" ? (
              <ToursMegaMenuPanel
                columns={section.columns}
                t={t}
                onNavigate={onNavigate}
                layout="drawer"
              />
            ) : (
              <MegaMenuPanel columns={section.columns} t={t} onNavigate={onNavigate} showIcons />
            )
          ) : null}
        </section>
      ))}
    </div>
  );
}

export function SiteNavFullScreenOverlay({
  open,
  onClose,
  title,
  sections,
  pathname,
  t,
  returnFocusRef,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sections: SiteNavSection[];
  pathname: string;
  t: NavTranslate;
  returnFocusRef?: RefObject<HTMLElement | null>;
  footer?: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const mounted = typeof document !== "undefined";

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    const panel = panelRef.current;
    if (!panel) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open || !returnFocusRef?.current) return;
    returnFocusRef.current.focus();
  }, [open, returnFocusRef]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id="site-nav-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-full flex-col bg-surface-elevated"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-4 py-3 sm:px-6">
          <p className="font-heading text-lg font-semibold text-charcoal">{title}</p>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface-elevated text-foreground transition-colors hover:border-sky/40 hover:bg-sky/5 hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
            aria-label="Закрыть"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <SiteNavDrawer
              sections={sections}
              pathname={pathname}
              t={t}
              onNavigate={onClose}
            />
          </div>
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-border-subtle px-4 py-4 sm:px-6">
            <div className="mx-auto max-w-3xl">{footer}</div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
