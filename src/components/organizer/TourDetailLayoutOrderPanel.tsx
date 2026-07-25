"use client";

import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NATIVE_TOUR_LAYOUT_DEFAULT_ORDER,
  NATIVE_TOUR_LAYOUT_SLOT_META,
  resolveNativeTourLayoutOrder,
  type NativeTourLayoutSlotId,
} from "@/lib/tour-detail/native-tour-layout-registry";

type Props = {
  value?: string[] | null;
  onChange: (next: string[] | undefined) => void;
};

function ordersEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  if (left.length !== right.length) return false;
  return left.every((id, index) => id === right[index]);
}

/**
 * Reorder native tour page sections without changing their markup.
 * Empty / default order keeps the public vertical identical to today.
 */
export default function TourDetailLayoutOrderPanel({ value, onChange }: Props) {
  const order = resolveNativeTourLayoutOrder(value);
  const isDefault = ordersEqual(order, NATIVE_TOUR_LAYOUT_DEFAULT_ORDER);

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= order.length) return;
    const next = [...order];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange(ordersEqual(next, NATIVE_TOUR_LAYOUT_DEFAULT_ORDER) ? undefined : next);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-surface-muted/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-charcoal">Порядок секций на странице</p>
          <p className="mt-1 text-xs leading-relaxed text-slate">
            Меняет только последовательность уже существующих блоков карточки тура. Шапка, галерея и
            сайдбар бронирования не затрагиваются. По умолчанию — как на сайте сейчас.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isDefault}
          onClick={() => onChange(undefined)}
        >
          <RotateCcw className="mr-1 h-3.5 w-3.5" aria-hidden />
          Как сейчас
        </Button>
      </div>
      <ol className="mt-3 space-y-1.5">
        {order.map((slotId, index) => {
          const meta = NATIVE_TOUR_LAYOUT_SLOT_META[slotId as NativeTourLayoutSlotId];
          return (
            <li
              key={slotId}
              className="flex items-center gap-2 rounded-lg border border-gray-200/80 bg-white px-2.5 py-2"
            >
              <span className="w-6 shrink-0 text-center text-[11px] font-semibold text-muted">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 text-sm text-charcoal">{meta.label}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                aria-label={`Поднять «${meta.label}»`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp className="h-3.5 w-3.5" aria-hidden />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                aria-label={`Опустить «${meta.label}»`}
                disabled={index === order.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
