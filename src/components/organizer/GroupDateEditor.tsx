"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDateRange } from "@/lib/utils";
import type { OrganizerGroupTourDate } from "@/data/tour-booking-defaults";

interface GroupDateEditorProps {
  date: OrganizerGroupTourDate;
  index: number;
  currencySuffix: string;
  onChange: (date: OrganizerGroupTourDate) => void;
  onRemove: () => void;
}

export default function GroupDateEditor({
  date,
  index,
  currencySuffix,
  onChange,
  onRemove,
}: GroupDateEditorProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-charcoal">Заезд {index + 1}</p>
          <p className="mt-1 text-sm text-slate">
            {date.startDate ? formatDateRange(date.startDate, date.endDate) : "—"}
          </p>
          <p className="mt-2 text-xs text-slate">
            <span className="font-semibold text-charcoal">
              {date.priceUsd} {currencySuffix}
            </span>
            {" · "}
            {date.spotsLeft} / {date.totalSeats} мест
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-charcoal hover:border-brand/30"
          >
            {expanded ? (
              <>
                Свернуть
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Изменить
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate transition-colors hover:text-brand"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-charcoal">
                Стоимость за туриста, {currencySuffix}
              </label>
              <Input
                type="number"
                min={0}
                value={date.priceUsd || ""}
                onChange={(event) =>
                  onChange({
                    ...date,
                    priceUsd: Math.max(0, Number(event.target.value) || 0),
                  })
                }
              />
              <p className="mt-1 text-[11px] text-slate">
                Для каждой даты можно указать свою цену — турист увидит её в календаре
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-charcoal">Всего мест</label>
                <Input
                  type="number"
                  min={0}
                  value={date.totalSeats || ""}
                  onChange={(event) =>
                    onChange({
                      ...date,
                      totalSeats: Math.max(0, Number(event.target.value) || 0),
                    })
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-charcoal">Свободно</label>
                <Input
                  type="number"
                  min={0}
                  value={date.spotsLeft || ""}
                  onChange={(event) =>
                    onChange({
                      ...date,
                      spotsLeft: Math.max(0, Number(event.target.value) || 0),
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-charcoal">
                Срок полной оплаты (дней до старта)
              </label>
              <Input
                type="number"
                min={0}
                value={date.fullPaymentDaysBefore}
                onChange={(event) =>
                  onChange({
                    ...date,
                    fullPaymentDaysBefore: Math.max(0, Number(event.target.value) || 0),
                  })
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-charcoal">Предоплата</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  value={date.prepaymentAmount}
                  onChange={(event) =>
                    onChange({
                      ...date,
                      prepaymentAmount: Math.max(0, Number(event.target.value) || 0),
                    })
                  }
                />
                <select
                  value={date.prepaymentType}
                  onChange={(event) =>
                    onChange({
                      ...date,
                      prepaymentType: event.target.value as OrganizerGroupTourDate["prepaymentType"],
                    })
                  }
                  className="rounded-xl border border-gray-200 bg-white px-3 text-sm"
                >
                  <option value="percent">%</option>
                  <option value="fixed">{currencySuffix}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={date.notGuaranteed}
                onChange={(event) =>
                  onChange({ ...date, notGuaranteed: event.target.checked })
                }
                className="h-4 w-4 accent-brand"
              />
              Предварительная дата
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={date.flightIncluded}
                onChange={(event) =>
                  onChange({ ...date, flightIncluded: event.target.checked })
                }
                className="h-4 w-4 accent-brand"
              />
              Перелёт включён
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={date.applyDiscount}
                onChange={(event) =>
                  onChange({ ...date, applyDiscount: event.target.checked })
                }
                className="h-4 w-4 accent-brand"
              />
              Применить скидку
            </label>
          </div>
        </div>
      ) : null}
    </article>
  );
}
