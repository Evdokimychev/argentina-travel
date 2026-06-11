"use client";

import { useEffect, useState } from "react";
import {
  getPlatformStatsFromRepository,
  mergePlatformStats,
  type PlatformStats,
} from "@/lib/organizer-public";
import HubQuickFactsGrid from "@/components/guide/hub/HubQuickFactsGrid";
import { tripsWord } from "@/lib/pluralize";
import { siteContainerClass } from "@/lib/site-container";

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

export default function PlatformStatsBlock({ initialStats }: { initialStats: PlatformStats }) {
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    const completed = countCompletedBookings();
    setStats(mergePlatformStats(getPlatformStatsFromRepository(), completed));
  }, []);

  if (stats.isNewPlatform && stats.tourCount <= 3) {
    return (
      <section className="border-y border-gray-100 bg-surface-muted/50 py-10">
        <div className={siteContainerClass}>
          <HubQuickFactsGrid
            columns={3}
            facts={[
              {
                emoji: "✨",
                label: "Площадка",
                headline: "Новая площадка авторских туров",
                detail:
                  stats.tourCount > 0
                    ? `В каталоге уже ${stats.tourCount} ${tripsWord(stats.tourCount)} — отзывы появятся после реальных поездок`
                    : "Первые маршруты уже в каталоге — отзывы появятся после реальных поездок",
              },
            ]}
          />
        </div>
      </section>
    );
  }

  const facts = [
    stats.tourCount > 0
      ? {
          emoji: "🗺",
          label: "Каталог",
          headline: `${stats.tourCount} ${tripsWord(stats.tourCount)}`,
          detail: "Авторские маршруты по всей стране",
        }
      : null,
    stats.organizerCount > 0
      ? {
          emoji: "🧭",
          label: stats.organizerCount === 1 ? "Организатор" : "Организаторы",
          headline: String(stats.organizerCount),
          detail: "Проверенные гиды и туроператоры",
        }
      : null,
    stats.completedBookingsCount != null && stats.completedBookingsCount > 0
      ? {
          emoji: "✅",
          label: "Поездки",
          headline: String(stats.completedBookingsCount),
          detail: "Завершённые бронирования на площадке",
        }
      : null,
  ].filter(Boolean) as Array<{
    emoji: string;
    label: string;
    headline: string;
    detail: string;
  }>;

  if (facts.length === 0) return null;

  return (
    <section className="border-y border-gray-100 bg-surface-muted/50 py-10">
      <div className={siteContainerClass}>
        <HubQuickFactsGrid facts={facts} columns={facts.length >= 3 ? 3 : 3} />
      </div>
    </section>
  );
}
