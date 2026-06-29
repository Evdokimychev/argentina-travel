"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Handshake, Map, Sparkles, Users } from "lucide-react";
import { mergePlatformStats, type PlatformStats } from "@/lib/organizer-public";
import { formatCatalogStatsDetail } from "@/lib/catalog-stats";
import { useRevealAnimation } from "@/hooks/useRevealAnimation";
import { formatTours, tripsWord } from "@/lib/pluralize";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";

function countCompletedBookings(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem("argentina-travel-bookings");
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as Array<{ status?: string }>;
    if (!Array.isArray(parsed)) return 0;
    return parsed.filter((booking) => booking.status === "completed").length;
  } catch {
    return 0;
  }
}

type StatCard = {
  icon: LucideIcon;
  label: string;
  value: number;
  formatValue: (n: number) => string;
  detail: string;
};

function StatTile({
  card,
  revealed,
  delayClass,
}: {
  card: StatCard;
  revealed: boolean;
  delayClass?: string;
}) {
  const Icon = card.icon;

  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-5 shadow-card sm:p-6",
        !revealed && "opacity-0",
        revealed && cn("animate-fade-in-up motion-reduce:opacity-100", delayClass)
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky">
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate">{card.label}</span>
      </div>
      <p className="mt-4 font-heading text-3xl font-bold tabular-nums text-charcoal sm:text-4xl">
        {card.formatValue(card.value)}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate">{card.detail}</p>
    </div>
  );
}

export default function PlatformStatsBlock({ initialStats }: { initialStats: PlatformStats }) {
  const [stats, setStats] = useState(initialStats);
  const { ref, revealed } = useRevealAnimation<HTMLElement>(0.15);

  useEffect(() => {
    const completed = countCompletedBookings();
    setStats((prev) => mergePlatformStats(prev, completed));
  }, []);

  if (stats.isNewPlatform && stats.totalTourCount <= 3) {
    return (
      <section ref={ref} className="border-y border-gray-100 bg-gradient-to-b from-white to-surface-muted/40 py-10">
        <div className={siteContainerClass}>
          <StatTile
            revealed={revealed}
            card={{
              icon: Sparkles,
              label: "Площадка",
              value: stats.totalTourCount,
              formatValue: (n: number) => (n > 0 ? `${n} ${tripsWord(n)}` : "Старт"),
              detail:
                stats.totalTourCount > 0
                  ? "Авторские маршруты уже в каталоге — отзывы появятся после реальных поездок"
                  : "Первые маршруты уже в каталоге — отзывы появятся после реальных поездок",
            }}
          />
        </div>
      </section>
    );
  }

  const catalogDetail = formatCatalogStatsDetail({
    nativeCount: stats.tourCount,
    partnerCount: stats.partnerTourCount,
    totalCount: stats.totalTourCount,
    organizerCount: stats.organizerCount,
  });

  const cards: StatCard[] = [
    stats.partnerTourCount > 0 && stats.tourCount > 0
      ? {
          icon: Map,
          label: "Авторские",
          value: stats.tourCount,
          formatValue: (n: number) => formatTours(n),
          detail: "Маршруты организаторов площадки",
        }
      : stats.totalTourCount > 0
        ? {
            icon: Map,
            label: "Каталог",
            value: stats.totalTourCount,
            formatValue: (n: number) => formatTours(n),
            detail: catalogDetail,
          }
        : null,
    stats.partnerTourCount > 0
      ? {
          icon: Handshake,
          label: "Партнёрские",
          value: stats.partnerTourCount,
          formatValue: (n: number) => formatTours(n),
          detail: "Tripster и YouTravel — бронирование на стороне партнёра",
        }
      : null,
    stats.organizerCount > 0
      ? {
          icon: Users,
          label: stats.organizerCount === 1 ? "Организатор" : "Организаторы",
          value: stats.organizerCount,
          formatValue: (n: number) => String(n),
          detail: "Проверенные гиды и туроператоры",
        }
      : null,
    stats.completedBookingsCount != null && stats.completedBookingsCount > 0
      ? {
          icon: CheckCircle2,
          label: "Поездки",
          value: stats.completedBookingsCount,
          formatValue: (n: number) => String(n),
          detail: "Завершённые бронирования на площадке",
        }
      : null,
  ].filter(Boolean) as StatCard[];

  if (cards.length === 0) return null;

  const delayClasses = ["", "animate-delay-100", "animate-delay-200"];

  return (
    <section
      ref={ref}
      className="border-y border-gray-100 bg-gradient-to-b from-surface-muted/30 via-white to-surface-muted/20 py-10 md:py-12"
    >
      <div className={siteContainerClass}>
        <div
          className={cn(
            "grid gap-4",
            cards.length >= 3 ? "sm:grid-cols-3" : cards.length === 2 ? "sm:grid-cols-2" : "max-w-md"
          )}
        >
          {cards.map((card, index) => (
            <StatTile key={card.label} card={card} revealed={revealed} delayClass={delayClasses[index]} />
          ))}
        </div>
      </div>
    </section>
  );
}
