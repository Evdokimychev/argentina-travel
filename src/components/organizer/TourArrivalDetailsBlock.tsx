"use client";

import { Input } from "@/components/ui/input";
import { SwitchField } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ORGANIZER_ARRIVAL_CITY_COMMENT_MAX,
  linesToLogisticsList,
} from "@/data/tour-logistics-defaults";

interface TourArrivalDetailsBlockProps {
  enabled: boolean;
  airportsText: string;
  transfersText: string;
  meetingPoint: string;
  mapStartPoint: string;
  onEnabledChange: (enabled: boolean) => void;
  onChange: (patch: {
    arrivalAirportsText?: string;
    arrivalTransfersText?: string;
    arrivalMeetingPoint?: string;
  }) => void;
}

function FieldTextarea({
  id,
  label,
  hint,
  value,
  placeholder,
  rows = 3,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className="block space-y-1.5">
      <span className="text-xs font-medium text-charcoal">{label}</span>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <span className="block text-[11px] leading-relaxed text-slate">{hint}</span> : null}
    </label>
  );
}

export default function TourArrivalDetailsBlock({
  enabled,
  airportsText,
  transfersText,
  meetingPoint,
  mapStartPoint,
  onEnabledChange,
  onChange,
}: TourArrivalDetailsBlockProps) {
  const previewAirports = linesToLogisticsList(airportsText);
  const previewTransfers = linesToLogisticsList(transfersText);
  const previewMeetingPoint = meetingPoint.trim() || mapStartPoint.trim();

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <SwitchField
        checked={enabled}
        onCheckedChange={onEnabledChange}
        label="Аэропорты, трансферы и место встречи"
        description="Блок «Как добраться» на странице тура: аэропорты, рекомендуемые рейсы, трансферы и точка встречи."
      />

      {enabled ? (
        <div className="space-y-4 border-t border-gray-200/80 pt-4">
          <FieldTextarea
            id="arrival-airports-text"
            label="Аэропорты"
            hint="Каждый аэропорт с новой строки."
            value={airportsText}
            placeholder={"Буэнос-Айрес, аэропорт Ezeiza\nEl Calafate (FTE)"}
            onChange={(arrivalAirportsText) => onChange({ arrivalAirportsText })}
          />

          <FieldTextarea
            id="arrival-transfers-text"
            label="Трансферы"
            hint="Каждый пункт с новой строки."
            value={transfersText}
            placeholder="Трансфер из аэропорта включён в стоимость тура."
            onChange={(arrivalTransfersText) => onChange({ arrivalTransfersText })}
          />

          <label htmlFor="arrival-meeting-point" className="block space-y-1.5">
            <span className="text-xs font-medium text-charcoal">Место встречи</span>
            <Input
              id="arrival-meeting-point"
              type="text"
              value={meetingPoint}
              maxLength={ORGANIZER_ARRIVAL_CITY_COMMENT_MAX}
              placeholder={mapStartPoint || "Буэнос-Айрес, аэропорт Ezeiza"}
              onChange={(event) => onChange({ arrivalMeetingPoint: event.target.value })}
            />
            {mapStartPoint ? (
              <span className="block text-[11px] leading-relaxed text-slate">
                Если поле пустое, на странице тура будет показана точка на карте: {mapStartPoint}
              </span>
            ) : null}
          </label>

          <div className="rounded-2xl border border-sky-200/70 bg-sky-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate">Предпросмотр</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-charcoal">Аэропорты</p>
                <p className="mt-1 text-sm text-slate">
                  {previewAirports.length
                    ? previewAirports.map((item) => `✈ ${item}`).join(" · ")
                    : "Не указано"}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-charcoal">Трансферы</p>
                <p className="mt-1 text-sm text-slate">
                  {previewTransfers.length ? previewTransfers.join(" · ") : "Не указано"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm font-semibold text-charcoal">Место встречи</p>
                <p className="mt-1 text-sm text-slate">
                  {previewMeetingPoint || "Не указано"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
