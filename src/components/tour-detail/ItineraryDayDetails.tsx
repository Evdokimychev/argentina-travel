"use client";

import type { ReactNode } from "react";
import { BedDouble, Coffee, Footprints, Moon, Package, Sun, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import ItineraryActivityList from "./ItineraryActivityList";
import type { TourDayActivity } from "@/types/tour-itinerary-activity";

function inferMealIcon(label: string): LucideIcon {
  const normalized = label.toLowerCase();
  if (normalized.includes("завтрак")) return Coffee;
  if (normalized.includes("обед")) return Sun;
  if (normalized.includes("ужин")) return Moon;
  if (normalized.includes("ланч") || normalized.includes("бокс")) return Package;
  return UtensilsCrossed;
}

function DayInfoBlock({
  title,
  icon: Icon,
  accent,
  children,
  className,
  contentClassName,
}: {
  title: string;
  icon: LucideIcon;
  accent: "neutral" | "warm" | "sky";
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const accentStyles = {
    neutral: {
      wrap: "border-gray-100/90 from-gray-50/30 to-white",
      head: "border-gray-100/70 bg-white/80",
      icon: "bg-gray-100/90 text-charcoal",
    },
    warm: {
      wrap: "border-amber-100/70 from-amber-50/20 to-white",
      head: "border-amber-100/50 bg-amber-50/15",
      icon: "bg-amber-100/70 text-amber-900",
    },
    sky: {
      wrap: "border-sky/12 from-sky/[0.03] to-white",
      head: "border-sky/8 bg-sky/[0.02]",
      icon: "bg-sky/10 text-sky-dark",
    },
  }[accent];

  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border bg-gradient-to-br",
        accentStyles.wrap,
        className
      )}
    >
      <header className={cn("flex items-center gap-2 border-b px-2.5 py-1.5", accentStyles.head)}>
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
            accentStyles.icon
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        </span>
        <h4 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-charcoal/90">
          {title}
        </h4>
      </header>
      <div className={cn("px-2.5 py-2", contentClassName)}>{children}</div>
    </section>
  );
}

function MealsList({ meals }: { meals: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {meals.map((meal) => {
        const Icon = inferMealIcon(meal);
        return (
          <li
            key={meal}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/90 px-2 py-1 text-xs leading-snug text-charcoal ring-1 ring-gray-100/90"
          >
            <Icon className="h-3 w-3 shrink-0 text-slate/80" strokeWidth={1.75} aria-hidden />
            <span className="truncate">{meal}</span>
          </li>
        );
      })}
    </ul>
  );
}

function AccommodationDetail({ accommodation }: { accommodation: string }) {
  const starMatch = accommodation.match(/(\d\*)/);
  const stars = starMatch?.[1];

  return (
    <p className="text-sm leading-snug text-charcoal">
      {stars ? (
        <span className="mr-1.5 inline-flex rounded-full bg-sky/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-dark align-middle">
          {stars}
        </span>
      ) : null}
      {accommodation}
    </p>
  );
}

interface ItineraryDayDetailsProps {
  activities: TourDayActivity[];
  meals: string[];
  accommodation: string;
}

export default function ItineraryDayDetails({
  activities,
  meals,
  accommodation,
}: ItineraryDayDetailsProps) {
  const hasActivities = activities.length > 0;
  const hasMeals = meals.length > 0;
  const hasAccommodation = Boolean(accommodation.trim());
  const hasLogistics = hasMeals || hasAccommodation;

  if (!hasActivities && !hasLogistics) return null;

  return (
    <div className="space-y-2">
      {hasActivities ? (
        <DayInfoBlock title="Активности" icon={Footprints} accent="neutral" contentClassName="px-1.5 py-1">
          <ItineraryActivityList activities={activities} variant="itinerary" />
        </DayInfoBlock>
      ) : null}

      {hasLogistics ? (
        <div
          className={cn(
            "grid gap-2",
            hasMeals && hasAccommodation ? "sm:grid-cols-2" : "grid-cols-1"
          )}
        >
          {hasMeals ? (
            <DayInfoBlock title="Питание" icon={UtensilsCrossed} accent="warm">
              <MealsList meals={meals} />
            </DayInfoBlock>
          ) : null}
          {hasAccommodation ? (
            <DayInfoBlock title="Проживание" icon={BedDouble} accent="sky">
              <AccommodationDetail accommodation={accommodation.trim()} />
            </DayInfoBlock>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
