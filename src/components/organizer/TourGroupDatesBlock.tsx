"use client";

import { useState } from "react";
import { Info, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SwitchRow } from "@/components/ui/switch";
import TourGroupDatesAddModal from "@/components/organizer/TourGroupDatesAddModal";
import { formatDateRange } from "@/lib/utils";
import {
  type OrganizerGroupTourDate,
} from "@/data/tour-booking-defaults";
import { cn } from "@/lib/cn";
import type { CurrencyCode } from "@/types/locale";

interface TourGroupDatesBlockProps {
  dates: OrganizerGroupTourDate[];
  autoRollToNextYear: boolean;
  durationDays: number;
  durationNights: number;
  priceCurrency: CurrencyCode;
  defaultPriceUsd: number;
  onDatesChange: (dates: OrganizerGroupTourDate[]) => void;
  onAutoRollChange: (enabled: boolean) => void;
}

function GroupDateSummary({
  date,
  index,
  onRemove,
}: {
  date: OrganizerGroupTourDate;
  index: number;
  onRemove: () => void;
}) {
  const currencySuffix = "US$";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-charcoal">Заезд {index + 1}</p>
          <p className="mt-1 text-sm text-slate">
            {date.startDate ? formatDateRange(date.startDate, date.endDate) : "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate transition-colors hover:text-brand"
        >
          <Trash2 className="h-4 w-4" />
          Удалить
        </button>
      </div>

      <dl className="mt-3 grid gap-2 text-xs text-slate sm:grid-cols-2">
        <div>
          <dt className="text-slate/80">Стоимость</dt>
          <dd className="font-medium text-charcoal">
            {date.priceUsd} {currencySuffix}
          </dd>
        </div>
        <div>
          <dt className="text-slate/80">Места</dt>
          <dd className="font-medium text-charcoal">
            {date.spotsLeft} / {date.totalSeats}
          </dd>
        </div>
        <div>
          <dt className="text-slate/80">Предоплата</dt>
          <dd className="font-medium text-charcoal">
            {date.prepaymentAmount}
            {date.prepaymentType === "percent" ? "%" : ` ${currencySuffix}`}
          </dd>
        </div>
        <div>
          <dt className="text-slate/80">Статус</dt>
          <dd className="font-medium text-charcoal">
            {date.notGuaranteed ? "Предварительная дата" : "Подтверждено"}
            {date.flightIncluded ? " · перелёт включён" : ""}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default function TourGroupDatesBlock({
  dates,
  autoRollToNextYear,
  durationDays,
  durationNights,
  priceCurrency,
  defaultPriceUsd,
  onDatesChange,
  onAutoRollChange,
}: TourGroupDatesBlockProps) {
  const [modalOpen, setModalOpen] = useState(false);

  function removeAt(index: number) {
    onDatesChange(dates.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleAddDates(nextDates: OrganizerGroupTourDate[]) {
    onDatesChange([...dates, ...nextDates]);
  }

  return (
    <>
      <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
          Даты группового тура
        </h2>

        <SwitchRow
          checked={autoRollToNextYear}
          onCheckedChange={onAutoRollChange}
          label="Автоматически переносить групповые даты на следующий год"
          labelAddon={<Info className="h-4 w-4 shrink-0 text-sky" aria-hidden />}
        />

        {dates.length ? (
          <div className="space-y-3">
            {dates.map((date, index) => (
              <GroupDateSummary
                key={date.id}
                date={date}
                index={index}
                onRemove={() => removeAt(index)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm text-charcoal">
            Групповые даты не заполнены
          </div>
        )}

        <div className="flex justify-end">
          <Button type="button" onClick={() => setModalOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Добавить групповые даты
          </Button>
        </div>
      </section>

      <TourGroupDatesAddModal
        open={modalOpen}
        durationDays={durationDays}
        durationNights={durationNights}
        currency={priceCurrency}
        defaultPriceUsd={defaultPriceUsd}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddDates}
      />
    </>
  );
}
