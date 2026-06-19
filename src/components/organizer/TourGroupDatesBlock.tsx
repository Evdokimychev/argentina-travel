"use client";

import { useState } from "react";
import { Info, Plus } from "lucide-react";
import { useHtml5ListReorder } from "@/hooks/useHtml5ListReorder";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { SwitchRow } from "@/components/ui/switch";
import TourGroupDatesAddModal from "@/components/organizer/TourGroupDatesAddModal";
import GroupDateEditor from "@/components/organizer/GroupDateEditor";
import { type OrganizerGroupTourDate } from "@/data/tour-booking-defaults";
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
  const currencySuffix = priceCurrency === "USD" ? "US$" : priceCurrency;

  function removeAt(index: number) {
    onDatesChange(dates.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateAt(index: number, date: OrganizerGroupTourDate) {
    onDatesChange(dates.map((item, itemIndex) => (itemIndex === index ? date : item)));
  }

  function handleAddDates(nextDates: OrganizerGroupTourDate[]) {
    onDatesChange([...dates, ...nextDates]);
  }

  const hasVariedPrices =
    dates.length > 1 && new Set(dates.map((date) => date.priceUsd)).size > 1;

  const reorder = useHtml5ListReorder(dates, onDatesChange);

  return (
    <>
      <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
        <div>
          <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
            Даты группового тура
          </h2>
          <p className="mt-1 text-sm text-slate">
            Укажите даты заезда и стоимость для каждой — турист увидит цены в календаре на странице
            тура.
            {reorder.canReorder
              ? " Перетащите карточку за ручку слева, чтобы изменить порядок в календаре."
              : null}
          </p>
        </div>

        <p className="flex items-start gap-2 rounded-xl border border-sky/15 bg-sky/[0.06] px-3.5 py-2.5 text-sm leading-relaxed text-charcoal">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
          Разная стоимость на разные даты: задайте цену при добавлении заезда или измените её в
          карточке даты. В календаре бронирования доступны только указанные здесь даты.
        </p>

        <SwitchRow
          checked={autoRollToNextYear}
          onCheckedChange={onAutoRollChange}
          label="Автоматически переносить групповые даты на следующий год"
          labelAddon={<Info className="h-4 w-4 shrink-0 text-sky" aria-hidden />}
        />

        {hasVariedPrices ? (
          <p className="rounded-xl border border-violet-100 bg-violet-50/80 px-3.5 py-2 text-sm text-violet-950">
            На странице тура отображается диапазон цен и календарь с суммой на каждую дату заезда.
          </p>
        ) : null}

        {dates.length ? (
          <div className="space-y-3">
            {dates.map((date, index) => (
              <div
                key={date.id}
                onDragOver={(event) => reorder.onDragOver(index, event)}
                onDrop={(event) => reorder.onDrop(index, event)}
                className={cn(reorder.rowClassName(index))}
              >
                <GroupDateEditor
                  date={date}
                  index={index}
                  currencySuffix={currencySuffix}
                  onChange={(next) => updateAt(index, next)}
                  onRemove={() => removeAt(index)}
                  canReorder={reorder.canReorder}
                  isDragging={reorder.dragIndex === index}
                  onDragStart={(event) => reorder.onDragStart(index, event)}
                  onDragEnd={reorder.onDragEnd}
                />
              </div>
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
