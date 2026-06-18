"use client";

import Link from "next/link";
import { ArrowRight, FileText, Plane, Stamp } from "lucide-react";
import { MegaMenuPanel, NavBadge } from "@/components/navigation/MegaMenuPanel";
import { cn } from "@/lib/cn";
import {
  IMMIGRATION_NAV_PROMO_INTRO,
  IMMIGRATION_NAV_PROMO_TITLE,
  buildImmigrationFeaturedLinks,
} from "@/lib/immigration-nav";
import { getImmigrationNavIcon } from "@/lib/immigration-nav-icons";
import { navLinkLabel, resolveNavLabel } from "@/lib/site-nav";
import type { NavTranslate } from "@/lib/site-nav";
import type { SiteNavColumn, SiteNavLink } from "@/types/site-nav";

function ImmigrationFeaturedCard({
  link,
  t,
  onNavigate,
}: {
  link: SiteNavLink;
  t: NavTranslate;
  onNavigate?: () => void;
}) {
  const Icon = getImmigrationNavIcon(link.id);

  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className="group flex min-w-0 flex-1 flex-col rounded-xl border border-border-subtle bg-surface-muted/50 p-3.5 transition-colors hover:border-sky/30 hover:bg-sky/5 sm:p-4"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky/10 text-sky transition-colors group-hover:bg-sky group-hover:text-white">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="mt-3 font-heading text-sm font-semibold text-charcoal group-hover:text-sky">
        {navLinkLabel(link, t)}
      </span>
      {link.description ? (
        <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate">{link.description}</span>
      ) : null}
    </Link>
  );
}

function ImmigrationPromoBlock({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex flex-col rounded-xl bg-gradient-to-br from-sky/10 via-surface-muted/80 to-surface-muted/40 p-4 sm:p-5 lg:min-h-full">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky/15 text-sky">
        <Stamp className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mt-4 font-heading text-base font-bold leading-snug text-charcoal">
        {IMMIGRATION_NAV_PROMO_TITLE}
      </h3>
      <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate">{IMMIGRATION_NAV_PROMO_INTRO}</p>
      <Link
        href="/immigration"
        onClick={onNavigate}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky transition-colors hover:text-sky/80"
      >
        Открыть справочник
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </aside>
  );
}

function ImmigrationFooterStrip({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border-subtle px-5 py-3 text-sm">
      <Link
        href="/guide/kak-dobratsya#entry-docs"
        onClick={onNavigate}
        className="inline-flex items-center gap-2 font-medium text-charcoal transition-colors hover:text-sky"
      >
        <Plane className="h-4 w-4 text-slate" aria-hidden />
        Правила въезда
      </Link>
      <Link
        href="/immigration/dokumenty-dlya-vyezda"
        onClick={onNavigate}
        className="inline-flex items-center gap-2 font-medium text-charcoal transition-colors hover:text-sky"
      >
        <FileText className="h-4 w-4 text-slate" aria-hidden />
        Чеклист документов
      </Link>
      <Link
        href="/contacts"
        onClick={onNavigate}
        className="inline-flex items-center gap-2 font-medium text-charcoal transition-colors hover:text-sky"
      >
        Консультация
        <ArrowRight className="h-3.5 w-3.5 text-slate" aria-hidden />
      </Link>
    </div>
  );
}

export function ImmigrationMegaMenuPanel({
  columns,
  t,
  onNavigate,
  className,
  layout = "desktop",
}: {
  columns: SiteNavColumn[];
  t: NavTranslate;
  onNavigate?: () => void;
  className?: string;
  layout?: "desktop" | "drawer";
}) {
  const featured = buildImmigrationFeaturedLinks();

  return (
    <div className={cn("flex flex-col", className)}>
      <div
        className={cn(
          "gap-5 p-5",
          layout === "desktop" ? "lg:grid lg:grid-cols-[minmax(13rem,16rem)_1fr]" : "space-y-5"
        )}
      >
        <ImmigrationPromoBlock onNavigate={onNavigate} />

        <div className="min-w-0 space-y-5">
          <div>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate">
              {resolveNavLabel({ label: "Популярное", labelKey: "nav.columns.popular" }, t)}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {featured.map((link) => (
                <ImmigrationFeaturedCard key={link.id} link={link} t={t} onNavigate={onNavigate} />
              ))}
            </div>
          </div>

          <MegaMenuPanel
            columns={columns}
            t={t}
            onNavigate={onNavigate}
            showIcons
            resolveIcon={(link) => getImmigrationNavIcon(link.id)}
            className="p-0 sm:grid-cols-2"
          />
        </div>
      </div>

      <ImmigrationFooterStrip onNavigate={onNavigate} />
    </div>
  );
}

export { NavBadge };
