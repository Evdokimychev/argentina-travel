"use client";

import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { MegaMenuPanel } from "@/components/navigation/MegaMenuPanel";
import { cn } from "@/lib/cn";
import type { NavTranslate } from "@/lib/site-nav";
import type { SiteNavColumn, SiteNavLink } from "@/types/site-nav";

function DestinationsPromoBlock({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex flex-col rounded-xl bg-gradient-to-br from-sky/10 via-surface-muted/80 to-surface-muted/40 p-4 sm:p-5 lg:min-h-full">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky/15 text-sky">
        <MapPin className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mt-4 font-heading text-base font-bold leading-snug text-charcoal">
        Куда поехать в Аргентине
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate">
        Регионы, города и идеи для первой поездки — от Патагонии до Буэнос-Айреса.
      </p>
      <Link
        href="/destinations"
        onClick={onNavigate}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky transition-colors hover:text-sky/80"
      >
        Все направления
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </aside>
  );
}

function destinationIcon(_link: SiteNavLink) {
  return MapPin;
}

export function DestinationsMegaMenuPanel({
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
          layout === "desktop" ? "lg:grid lg:grid-cols-[minmax(13rem,16rem)_1fr]" : "space-y-5"
        )}
      >
        <DestinationsPromoBlock onNavigate={onNavigate} />
        <MegaMenuPanel
          columns={columns}
          t={t}
          onNavigate={onNavigate}
          showIcons
          resolveIcon={destinationIcon}
          className="p-0 sm:grid-cols-2"
        />
      </div>
      <div className="border-t border-border-subtle px-5 py-3 text-xs text-slate">
        Подборка туров по региону — в{" "}
        <Link href="/tours" onClick={onNavigate} className="font-medium text-sky hover:underline">
          каталоге
        </Link>
      </div>
    </div>
  );
}
