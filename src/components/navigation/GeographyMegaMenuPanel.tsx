"use client";

import Link from "next/link";
import { ArrowRight, Map, MapPin, Mountain } from "lucide-react";
import { MegaMenuPanel } from "@/components/navigation/MegaMenuPanel";
import { MegaMenuServicesFooter } from "@/components/navigation/MegaMenuServicesFooter";
import { cn } from "@/lib/cn";
import type { NavTranslate } from "@/lib/site-nav";
import type { SiteNavColumn, SiteNavLink } from "@/types/site-nav";

function GeographyPromoBlock({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex flex-col rounded-xl bg-gradient-to-br from-sky/10 via-surface-muted/80 to-surface-muted/40 p-4 sm:p-5 lg:min-h-full">
      <div className="flex gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky/15 text-sky">
          <MapPin className="h-5 w-5" aria-hidden />
        </span>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
          <Mountain className="h-5 w-5" aria-hidden />
        </span>
      </div>
      <h3 className="mt-4 font-heading text-base font-bold leading-snug text-charcoal">
        Регионы и места
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate">
        <strong className="font-medium text-charcoal">Регионы</strong> — планирование поездки: сезоны,
        логистика и туры.{" "}
        <strong className="font-medium text-charcoal">Места</strong> — справочник парков, городов и
        достопримечательностей с картой.
      </p>
      <Link
        href="/destinations"
        onClick={onNavigate}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky transition-colors hover:text-sky/80"
      >
        Обзор регионов
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
      <Link
        href="/places"
        onClick={onNavigate}
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate transition-colors hover:text-sky"
      >
        Справочник мест
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
      <Link
        href="/places?view=map"
        onClick={onNavigate}
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate transition-colors hover:text-sky"
      >
        <Map className="h-3.5 w-3.5" aria-hidden />
        Карта мест
      </Link>
    </aside>
  );
}

function geographyIcon(link: SiteNavLink) {
  if (link.href.startsWith("/places") || link.id.startsWith("place-")) return Mountain;
  return MapPin;
}

export function GeographyMegaMenuPanel({
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
  return (
    <div className={cn("flex flex-col", className)}>
      <div
        className={cn(
          "gap-5 p-5",
          layout === "desktop" ? "lg:grid lg:grid-cols-[minmax(13rem,16rem)_1fr]" : "space-y-5",
        )}
      >
        <GeographyPromoBlock onNavigate={onNavigate} />
        <MegaMenuPanel
          columns={columns}
          t={t}
          onNavigate={onNavigate}
          showIcons
          resolveIcon={geographyIcon}
          className="p-0 sm:grid-cols-2 lg:grid-cols-3"
        />
      </div>
      <div className="border-t border-border-subtle px-5 py-2.5 text-xs text-slate/70">
        Туры и экскурсии к местам — в{" "}
        <Link href="/tours" onClick={onNavigate} className="transition-colors hover:text-sky">
          каталоге
        </Link>
        {" · "}
        <Link href="/collections" onClick={onNavigate} className="transition-colors hover:text-sky">
          подборки
        </Link>
        {" · "}
        <Link href="/itineraries" onClick={onNavigate} className="transition-colors hover:text-sky">
          маршруты
        </Link>
      </div>
      <MegaMenuServicesFooter t={t} onNavigate={onNavigate} />
    </div>
  );
}
