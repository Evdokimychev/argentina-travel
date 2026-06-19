"use client";

import { Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SwitchField, SwitchRow } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { TOUR_CITY_OPTIONS } from "@/data/tour-geography";
import {
  ORGANIZER_ARRIVAL_CITIES_MAX,
  ORGANIZER_ARRIVAL_CITY_COMMENT_MAX,
  ORGANIZER_TRANSPORT_DAY_OPTIONS,
  buildPlaneSchedulePreview,
  createEmptyArrivalDepartureCity,
  type OrganizerArrivalDepartureCity,
  type OrganizerTransportDayOption,
} from "@/data/tour-logistics-defaults";

interface TourArrivalDepartureBlockProps {
  enabled: boolean;
  cities: OrganizerArrivalDepartureCity[];
  onEnabledChange: (enabled: boolean) => void;
  onChange: (cities: OrganizerArrivalDepartureCity[]) => void;
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-charcoal">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-sm text-charcoal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FieldTimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-charcoal">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-sm text-charcoal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}

function updateCity(
  cities: OrganizerArrivalDepartureCity[],
  id: string,
  patch: Partial<OrganizerArrivalDepartureCity>
) {
  return cities.map((city) => (city.id === id ? { ...city, ...patch } : city));
}

function CityCard({
  index,
  city,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number;
  city: OrganizerArrivalDepartureCity;
  onChange: (next: OrganizerArrivalDepartureCity) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const preview = buildPlaneSchedulePreview(city);

  return (
    <article className="space-y-4 rounded-2xl border border-gray-200/80 bg-gray-50/40 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-gray-200/80 px-2 text-xs font-semibold text-charcoal">
          {index + 1}
        </span>
        <h3 className="text-sm font-semibold text-charcoal">Город</h3>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-charcoal">
          Город<span className="text-brand">*</span>
        </span>
        <select
          value={city.city}
          onChange={(event) => onChange({ ...city, city: event.target.value })}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-charcoal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">Выберите город</option>
          {TOUR_CITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
        <SwitchRow
          checked={city.canArrive}
          onCheckedChange={(canArrive) => onChange({ ...city, canArrive })}
          label="Можно прибывать в этот город"
          align="start"
        />
        <SwitchRow
          checked={city.canDepart}
          onCheckedChange={(canDepart) => onChange({ ...city, canDepart })}
          label="Можно отправляться из этого города"
          align="start"
        />
      </div>

      <div className="space-y-3 border-t border-gray-200/80 pt-4">
        <h4 className="text-sm font-semibold text-charcoal">Виды транспорта</h4>

        <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-950/80">
          Указывайте время в часовом поясе города прибытия или отправления. Если город в другом
          часовом поясе, турист увидит это в подсказке на странице тура.
        </div>

        <div className="space-y-4 rounded-xl border border-gray-200/80 bg-white p-4">
          <label className="flex items-center gap-2.5">
            <Checkbox
              checked={city.plane.enabled}
              onCheckedChange={(checked) =>
                onChange({
                  ...city,
                  plane: { ...city.plane, enabled: checked === true },
                })
              }
            />
            <span className="text-sm font-medium text-charcoal">Самолётом</span>
          </label>

          {city.plane.enabled ? (
            <div className="space-y-4 pl-7">
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldSelect
                  label="Выберите день прилёта"
                  value={city.plane.arrivalDay}
                  options={ORGANIZER_TRANSPORT_DAY_OPTIONS}
                  onChange={(arrivalDay) =>
                    onChange({
                      ...city,
                      plane: {
                        ...city.plane,
                        arrivalDay: arrivalDay as OrganizerTransportDayOption,
                      },
                    })
                  }
                />
                <FieldTimeInput
                  label="Укажите самое позднее время прилёта"
                  value={city.plane.latestArrivalTime}
                  onChange={(latestArrivalTime) =>
                    onChange({
                      ...city,
                      plane: { ...city.plane, latestArrivalTime },
                    })
                  }
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <FieldSelect
                  label="Выберите день вылета"
                  value={city.plane.departureDay}
                  options={ORGANIZER_TRANSPORT_DAY_OPTIONS}
                  onChange={(departureDay) =>
                    onChange({
                      ...city,
                      plane: {
                        ...city.plane,
                        departureDay: departureDay as OrganizerTransportDayOption,
                      },
                    })
                  }
                />
                <FieldTimeInput
                  label="Укажите самое раннее время вылета"
                  value={city.plane.earliestDepartureTime}
                  onChange={(earliestDepartureTime) =>
                    onChange({
                      ...city,
                      plane: { ...city.plane, earliestDepartureTime },
                    })
                  }
                />
              </div>

              {preview ? (
                <div className="rounded-xl bg-sky-50 px-3 py-2.5 text-xs leading-relaxed text-sky-950/90">
                  {preview}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <label className="flex items-center gap-2.5">
          <Checkbox
            checked={city.trainEnabled}
            onCheckedChange={(checked) =>
              onChange({ ...city, trainEnabled: checked === true })
            }
          />
          <span className="text-sm text-charcoal">Поездом</span>
        </label>

        <label className="flex items-center gap-2.5">
          <Checkbox
            checked={city.otherEnabled}
            onCheckedChange={(checked) =>
              onChange({ ...city, otherEnabled: checked === true })
            }
          />
          <span className="text-sm text-charcoal">Другое (автобус, автомобиль, …)</span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-charcoal">
            Комментарий для туриста по прибытию и отбытию для этого города (необязательно)
          </span>
          <textarea
            value={city.comment}
            maxLength={ORGANIZER_ARRIVAL_CITY_COMMENT_MAX}
            rows={3}
            onChange={(event) => onChange({ ...city, comment: event.target.value })}
            placeholder="Например: из аэропорта до отеля можно добраться на такси за 20 минут."
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-charcoal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>
      </div>

      {canRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate transition-colors hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
          Удалить город
        </button>
      ) : null}
    </article>
  );
}

export default function TourArrivalDepartureBlock({
  enabled,
  cities,
  onEnabledChange,
  onChange,
}: TourArrivalDepartureBlockProps) {
  const handleEnabledChange = (next: boolean) => {
    if (next && cities.length === 0) {
      onChange([createEmptyArrivalDepartureCity()]);
    }
    onEnabledChange(next);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <SwitchField
        checked={enabled}
        onCheckedChange={handleEnabledChange}
        label="Города прибытия и отправления"
        description="Формируют блок «Рекомендации по прибытию» на странице тура: время прилёта и вылета на самолёте."
      />

      {enabled ? (
        <div className="space-y-4 border-t border-gray-200/80 pt-4">
          {cities.map((city, index) => (
            <CityCard
              key={city.id}
              index={index}
              city={city}
              canRemove={cities.length > 1}
              onChange={(next) => onChange(updateCity(cities, city.id, next))}
              onRemove={() => onChange(cities.filter((item) => item.id !== city.id))}
            />
          ))}

          {cities.length < ORGANIZER_ARRIVAL_CITIES_MAX ? (
            <button
              type="button"
              onClick={() => onChange([...cities, createEmptyArrivalDepartureCity()])}
              className="inline-flex items-center gap-2 rounded-xl bg-brand/10 px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/15"
            >
              <Plus className="h-4 w-4" />
              Добавить город
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
