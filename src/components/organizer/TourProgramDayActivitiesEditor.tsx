"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ITINERARY_ACTIVITY_KIND_GROUPS,
  POPULAR_ITINERARY_ACTIVITY_KINDS,
  getItineraryActivityIcon,
  getItineraryActivityKindOption,
  getItineraryActivityLabel,
  type ItineraryActivityKind,
} from "@/data/itinerary-activity-kinds";
import { createEmptyDayActivity } from "@/lib/tour-itinerary-activity";
import ItineraryDayDetails from "@/components/tour-detail/ItineraryDayDetails";
import { cn } from "@/lib/cn";
import type { TourDayActivity } from "@/types/tour-itinerary-activity";
import {
  ORGANIZER_TOUR_DAY_ACTIVITIES_MAX,
  ORGANIZER_TOUR_DAY_ACTIVITY_DESCRIPTION_MAX,
} from "@/types/tour-itinerary-activity";
import TourTermsListBlock from "@/components/organizer/TourTermsListBlock";
import { ORGANIZER_TOUR_PROGRAM_DAY_ACCOMMODATION_MAX } from "@/data/tour-program-defaults";
import { ORGANIZER_TOUR_DAY_MEALS_MAX } from "@/types/tour-itinerary-activity";

interface TourProgramDayActivitiesEditorProps {
  activities: TourDayActivity[];
  meals: string[];
  accommodation: string;
  dayId: string;
  onActivitiesChange: (activities: TourDayActivity[]) => void;
  onMealsChange: (meals: string[]) => void;
  onAccommodationChange: (accommodation: string) => void;
}

function ActivityKindPicker({
  value,
  onChange,
  inputId,
}: {
  value: ItineraryActivityKind;
  onChange: (kind: ItineraryActivityKind) => void;
  inputId: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = getItineraryActivityKindOption(value);
  const SelectedIcon = selected.icon;

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return ITINERARY_ACTIVITY_KIND_GROUPS;

    return ITINERARY_ACTIVITY_KIND_GROUPS.map((group) => ({
      ...group,
      kinds: group.kinds.filter((kind) => {
        const option = getItineraryActivityKindOption(kind);
        return (
          option.label.toLowerCase().includes(normalized) ||
          option.keywords.some((keyword) => keyword.toLowerCase().includes(normalized))
        );
      }),
    })).filter((group) => group.kinds.length > 0);
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={inputId}
          className="flex h-11 w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-left text-sm text-charcoal transition-colors hover:border-gray-300"
        >
          <SelectedIcon className="h-[18px] w-[18px] shrink-0 stroke-[1.75]" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{selected.label}</span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-slate transition-transform", open && "rotate-180")}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(100vw-2rem,360px)] p-0">
        <div className="border-b border-gray-100 p-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск вида активности"
            className="h-9"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-1">
          {filteredGroups.map((group) => (
            <div key={group.title} className="py-1">
              <p className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate">
                {group.title}
              </p>
              <ul>
                {group.kinds.map((kind) => {
                  const option = getItineraryActivityKindOption(kind);
                  const Icon = option.icon;
                  const active = kind === value;
                  return (
                    <li key={kind}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(kind);
                          setOpen(false);
                          setQuery("");
                        }}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors",
                          active
                            ? "bg-brand/10 font-medium text-brand"
                            : "text-charcoal hover:bg-gray-50"
                        )}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0 stroke-[1.75]" aria-hidden />
                        {option.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ActivityCard({
  activity,
  index,
  total,
  dayId,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  activity: TourDayActivity;
  index: number;
  total: number;
  dayId: string;
  onChange: (activity: TourDayActivity) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const previewLabel = getItineraryActivityLabel(activity);
  const PreviewIcon = getItineraryActivityIcon(activity.kind);

  return (
    <article className="rounded-2xl border border-gray-200/80 bg-gray-50/40 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white">
            <PreviewIcon className="h-[18px] w-[18px] text-charcoal" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-charcoal">{previewLabel}</p>
            <p className="text-xs text-slate">Активность {index + 1}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white disabled:opacity-40"
            aria-label="Переместить выше"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white disabled:opacity-40"
            aria-label="Переместить ниже"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-red-600"
            aria-label="Удалить активность"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor={`activity-kind-${dayId}-${activity.id}`} className="text-xs font-medium text-slate">
            Вид активности
          </label>
          <ActivityKindPicker
            inputId={`activity-kind-${dayId}-${activity.id}`}
            value={activity.kind}
            onChange={(kind) => onChange({ ...activity, kind })}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor={`activity-title-${dayId}-${activity.id}`} className="text-xs font-medium text-slate">
            Название (необязательно)
          </label>
          <Input
            id={`activity-title-${dayId}-${activity.id}`}
            value={activity.title ?? ""}
            onChange={(event) => onChange({ ...activity, title: event.target.value })}
            placeholder="Например: трек к базе Torres"
          />
        </div>

        <div className="sm:col-span-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate">
            Время и дистанция
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor={`activity-duration-label-${dayId}-${activity.id}`}
            className="text-xs font-medium text-slate"
          >
            Длительность
          </label>
          <Input
            id={`activity-duration-label-${dayId}-${activity.id}`}
            value={activity.durationLabel ?? ""}
            onChange={(event) => onChange({ ...activity, durationLabel: event.target.value })}
            placeholder="3 ч, полдня"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={`activity-duration-min-${dayId}-${activity.id}`}
            className="text-xs font-medium text-slate"
          >
            Минуты (для автоформата)
          </label>
          <Input
            id={`activity-duration-min-${dayId}-${activity.id}`}
            type="number"
            min={1}
            value={activity.durationMinutes ?? ""}
            onChange={(event) =>
              onChange({
                ...activity,
                durationMinutes: event.target.value ? Number(event.target.value) : undefined,
              })
            }
            placeholder="180"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={`activity-distance-${dayId}-${activity.id}`}
            className="text-xs font-medium text-slate"
          >
            Дистанция, км
          </label>
          <Input
            id={`activity-distance-${dayId}-${activity.id}`}
            type="number"
            min={0}
            step={0.1}
            value={activity.distanceKm ?? ""}
            onChange={(event) =>
              onChange({
                ...activity,
                distanceKm: event.target.value ? Number(event.target.value) : undefined,
              })
            }
            placeholder="18"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`activity-up-${dayId}-${activity.id}`} className="text-xs font-medium text-slate">
            Набор высоты, м
          </label>
          <Input
            id={`activity-up-${dayId}-${activity.id}`}
            type="number"
            min={0}
            value={activity.elevationGainM ?? ""}
            onChange={(event) =>
              onChange({
                ...activity,
                elevationGainM: event.target.value ? Number(event.target.value) : undefined,
              })
            }
            placeholder="800"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`activity-down-${dayId}-${activity.id}`} className="text-xs font-medium text-slate">
            Спуск, м
          </label>
          <Input
            id={`activity-down-${dayId}-${activity.id}`}
            type="number"
            min={0}
            value={activity.elevationLossM ?? ""}
            onChange={(event) =>
              onChange({
                ...activity,
                elevationLossM: event.target.value ? Number(event.target.value) : undefined,
              })
            }
            placeholder="800"
          />
        </div>
          </div>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label
            htmlFor={`activity-description-${dayId}-${activity.id}`}
            className="text-xs font-medium text-slate"
          >
            Подробности
          </label>
          <Textarea
            id={`activity-description-${dayId}-${activity.id}`}
            value={activity.description ?? ""}
            maxLength={ORGANIZER_TOUR_DAY_ACTIVITY_DESCRIPTION_MAX}
            onChange={(event) => onChange({ ...activity, description: event.target.value })}
            placeholder="Что включено, уровень сложности, что взять с собой"
            rows={3}
          />
        </div>
      </div>
    </article>
  );
}

export default function TourProgramDayActivitiesEditor({
  activities,
  meals,
  accommodation,
  dayId,
  onActivitiesChange,
  onMealsChange,
  onAccommodationChange,
}: TourProgramDayActivitiesEditorProps) {
  const canAddActivity = activities.length < ORGANIZER_TOUR_DAY_ACTIVITIES_MAX;

  function updateActivityAt(index: number, next: TourDayActivity) {
    onActivitiesChange(activities.map((item, itemIndex) => (itemIndex === index ? next : item)));
  }

  function moveActivity(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= activities.length) return;
    const next = [...activities];
    [next[index], next[target]] = [next[target], next[index]];
    onActivitiesChange(next);
  }

  function removeActivityAt(index: number) {
    onActivitiesChange(activities.filter((_, itemIndex) => itemIndex !== index));
  }

  function addActivity(kind: ItineraryActivityKind = "walking") {
    if (!canAddActivity) return;
    onActivitiesChange([...activities, createEmptyDayActivity(kind)]);
  }

  return (
    <div className="space-y-6 border-t border-gray-200 pt-5">
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-charcoal">Активности дня</h4>
          <p className="mt-1 text-xs text-slate">
            Укажите активности с иконками, временем и километражем — так программа отображается на
            странице тура.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate">Быстро добавить</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_ITINERARY_ACTIVITY_KINDS.map((kind) => {
              const option = getItineraryActivityKindOption(kind);
              const Icon = option.icon;
              return (
                <button
                  key={kind}
                  type="button"
                  disabled={!canAddActivity}
                  onClick={() => addActivity(kind)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-charcoal transition-colors hover:border-brand/30 hover:bg-brand/5 disabled:opacity-50"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                index={index}
                total={activities.length}
                dayId={dayId}
                onChange={(next) => updateActivityAt(index, next)}
                onRemove={() => removeActivityAt(index)}
                onMoveUp={() => moveActivity(index, -1)}
                onMoveDown={() => moveActivity(index, 1)}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-slate">
            Пока нет активностей — добавьте первую, чтобы детализировать программу дня.
          </p>
        )}

        <button
          type="button"
          onClick={() => addActivity()}
          disabled={!canAddActivity}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand/30 bg-brand/5 px-4 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Добавить активность
        </button>
      </div>

      <TourTermsListBlock
        title="Питание"
        description="Завтрак, обед, ужин или особенности питания в этот день"
        items={meals}
        onChange={onMealsChange}
        placeholder="Завтрак"
        addLabel="Добавить приём пищи"
        variant="embedded"
        maxItems={ORGANIZER_TOUR_DAY_MEALS_MAX}
      />

      <div className="space-y-2">
        <label htmlFor={`program-day-accommodation-${dayId}`} className="text-sm font-semibold text-charcoal">
          Проживание
        </label>
        <Input
          id={`program-day-accommodation-${dayId}`}
          value={accommodation}
          maxLength={ORGANIZER_TOUR_PROGRAM_DAY_ACCOMMODATION_MAX}
          onChange={(event) => onAccommodationChange(event.target.value)}
          placeholder="Отель 4* в Эль-Калафате"
        />
      </div>

      {(activities.length > 0 || meals.length > 0 || accommodation.trim()) ? (
        <div className="space-y-2 border-t border-gray-100 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">
            Как увидят туристы
          </p>
          <ItineraryDayDetails
            activities={activities}
            meals={meals}
            accommodation={accommodation}
          />
        </div>
      ) : null}
    </div>
  );
}
