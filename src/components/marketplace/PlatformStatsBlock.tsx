"use client";

import { useEffect, useState } from "react";
import {
  getPlatformStatsFromRepository,
  mergePlatformStats,
  type PlatformStats,
} from "@/lib/organizer-public";
import { StatCard } from "@/components/ui/card";
import { tripsWord } from "@/lib/pluralize";

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
      <section className="border-y border-gray-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="font-heading text-lg font-semibold text-charcoal">
            Новая площадка авторских туров
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate">
            Мы только начинаем — отзывы и статистика появляются после реальных поездок. Сейчас в
            каталоге{" "}
            {stats.tourCount > 0 ? `${stats.tourCount} ${tripsWord(stats.tourCount)}` : "первые маршруты"}.
          </p>
        </div>
      </section>
    );
  }

  const items = [
    stats.tourCount > 0 ? { label: "Туров в каталоге", value: stats.tourCount } : null,
    stats.organizerCount > 0
      ? {
          label: stats.organizerCount === 1 ? "Организатор" : "Организаторов",
          value: stats.organizerCount,
        }
      : null,
    stats.completedBookingsCount != null && stats.completedBookingsCount > 0
      ? { label: "Завершённых поездок", value: stats.completedBookingsCount }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: number }>;

  if (items.length === 0) return null;

  return (
    <section className="border-y border-gray-100 bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 text-center sm:grid-cols-3">
          {items.map((item) => (
            <StatCard key={item.label} value={item.value} label={item.label} />
          ))}
        </div>
      </div>
    </section>
  );
}
