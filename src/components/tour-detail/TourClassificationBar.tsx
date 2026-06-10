import { ACTIVITY_TYPE_OPTIONS } from "@/data/activity-icons";
import type { Tour } from "@/types/tour";
import { cn } from "@/lib/cn";

interface TourClassificationBarProps {
  tour: Tour;
}

export default function TourClassificationBar({ tour }: TourClassificationBarProps) {
  const activities = tour.classification.activities.filter(Boolean);
  const collections = tour.classification.collections.filter(Boolean);
  const languages = tour.participants.languages.filter(Boolean);
  const tags = tour.classification.tags.filter(Boolean);

  const hasContent =
    activities.length > 0 ||
    collections.length > 0 ||
    languages.length > 0 ||
    tags.length > 0 ||
    tour.isPreliminaryProgram ||
    tour.partnerName?.trim();

  if (!hasContent) return null;

  return (
    <section aria-label="Характеристики тура" className="space-y-3">
      {(tour.isPreliminaryProgram || tour.partnerName?.trim()) && (
        <div className="flex flex-wrap items-center gap-2">
          {tour.isPreliminaryProgram ? (
            <span className="inline-flex rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-white">
              Предварительная программа
            </span>
          ) : null}
          {tour.partnerName?.trim() ? (
            <span className="inline-flex rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-charcoal">
              Площадка: {tour.partnerName}
            </span>
          ) : null}
        </div>
      )}

      {activities.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {activities.map((activity) => {
            const icon = ACTIVITY_TYPE_OPTIONS.find((option) => option.type === activity)?.icon;
            const Icon = icon;
            return (
              <span
                key={activity}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-charcoal"
              >
                {Icon ? <Icon className="h-3.5 w-3.5 text-brand" strokeWidth={1.75} /> : null}
                {activity}
              </span>
            );
          })}
        </div>
      ) : null}

      {collections.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {collections.map((collection) => (
            <span
              key={collection}
              className="inline-flex rounded-full bg-brand-light/80 px-3 py-1.5 text-xs font-medium text-charcoal"
            >
              {collection}
            </span>
          ))}
        </div>
      ) : null}

      {(languages.length > 0 || tags.length > 0) && (
        <div className={cn("flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate")}>
          {languages.length > 0 ? (
            <span>
              <span className="font-medium text-charcoal">Языки: </span>
              {languages.join(", ")}
            </span>
          ) : null}
          {tags.length > 0 ? (
            <span>
              <span className="font-medium text-charcoal">Теги: </span>
              {tags.join(", ")}
            </span>
          ) : null}
        </div>
      )}
    </section>
  );
}
