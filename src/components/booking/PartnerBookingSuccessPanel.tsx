"use client";

import Link from "next/link";
import { BookOpen, Compass, Map, MapPin, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type ExploreLink = {
  href: string;
  label: string;
  icon: typeof Compass;
};

type PartnerBookingSuccessPanelProps = {
  message: string;
  partnerLabel: string;
  partnerBookingUrl?: string | null;
  popupBlocked?: boolean;
  productType?: "excursion" | "tour";
  onClose?: () => void;
  className?: string;
};

function buildExploreLinks(productType: "excursion" | "tour"): ExploreLink[] {
  if (productType === "tour") {
    return [
      { href: "/tours", label: "Другие туры", icon: Map },
      { href: "/excursions", label: "Экскурсии", icon: Compass },
      { href: "/blog", label: "Статьи и советы", icon: BookOpen },
      { href: "/flights", label: "Авиабилеты", icon: Plane },
      { href: "/mapa-argentina", label: "Карта мест", icon: MapPin },
    ];
  }

  return [
    { href: "/excursions", label: "Другие экскурсии", icon: Compass },
    { href: "/tours", label: "Туры по Аргентине", icon: Map },
    { href: "/blog", label: "Статьи и советы", icon: BookOpen },
    { href: "/mapa-argentina", label: "Карта мест", icon: MapPin },
    { href: "/flights", label: "Авиабилеты", icon: Plane },
  ];
}

export default function PartnerBookingSuccessPanel({
  message,
  partnerLabel,
  partnerBookingUrl,
  popupBlocked,
  productType = "excursion",
  onClose,
  className,
}: PartnerBookingSuccessPanelProps) {
  const exploreLinks = buildExploreLinks(productType);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white px-4 py-3.5 text-sm leading-relaxed text-charcoal">
        {message}
      </div>

      {popupBlocked && partnerBookingUrl ? (
        <p className="text-sm leading-relaxed text-slate">
          Если вкладка с {partnerLabel} не открылась,{" "}
          <a
            href={partnerBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sky hover:underline"
          >
            откройте сайт партнёра вручную
          </a>
          .
        </p>
      ) : null}

      <section
        aria-label="Что ещё посмотреть на сайте"
        className="rounded-2xl border border-gray-100 bg-surface-muted/35 p-4"
      >
        <h3 className="text-sm font-semibold text-charcoal">Пока вы здесь</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate">
          Завершите бронирование на вкладке {partnerLabel} — на нашем сайте можно подобрать ещё идеи
          для поездки.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {exploreLinks.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={onClose}
                className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-sm font-medium text-charcoal transition-colors hover:border-sky/30 hover:bg-sky/[0.04]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky/10 text-sky">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 leading-snug">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
        {onClose ? (
          <Button type="button" variant="outline" className="mt-3 w-full rounded-xl" onClick={onClose}>
            Закрыть окно
          </Button>
        ) : null}
      </section>
    </div>
  );
}
