"use client";

import { useEffect, useState } from "react";
import {
  getMaintenanceCountdownParts,
  type MaintenanceCountdownParts,
} from "@/lib/maintenance-countdown";
import { cn } from "@/lib/cn";

const LABELS: Array<{ key: keyof MaintenanceCountdownParts; label: string }> = [
  { key: "months", label: "Месяцев" },
  { key: "days", label: "Дней" },
  { key: "hours", label: "Часов" },
  { key: "minutes", label: "Минут" },
  { key: "seconds", label: "Секунд" },
];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export default function MaintenanceCountdown({
  targetIso,
  className,
}: {
  targetIso: string;
  className?: string;
}) {
  const targetMs = new Date(targetIso).getTime();
  const [parts, setParts] = useState<MaintenanceCountdownParts>(() =>
    getMaintenanceCountdownParts(new Date(targetIso))
  );

  useEffect(() => {
    if (!Number.isFinite(targetMs)) return undefined;

    const tick = () => {
      setParts(getMaintenanceCountdownParts(new Date(targetMs)));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  if (!Number.isFinite(targetMs)) return null;

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4",
        className
      )}
      aria-live="polite"
      aria-label="Обратный отсчёт до открытия"
    >
      {LABELS.map(({ key, label }) => (
        <div
          key={key}
          className="rounded-2xl border border-white/15 bg-white/10 px-3 py-4 text-center backdrop-blur-sm"
        >
          <p className="font-heading text-3xl font-bold tabular-nums text-white sm:text-4xl">
            {pad(parts[key] as number)}
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-white/70">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
