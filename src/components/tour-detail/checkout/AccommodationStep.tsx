"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatTourists } from "@/lib/pluralize";
import FormattedPrice from "@/components/FormattedPrice";
import { CHECKOUT_ROOM_OPTIONS, type RoomOption } from "./types";
import {
  calcRoomsNeeded,
  DEFAULT_INCLUDED_ROOM_ID,
  formatRoomAllocationLine,
  formatRoomCount,
  getRoomAllocationStatus,
  isDefaultRoomAllocation,
  roomAllocationWarning,
  RoomAllocations,
  setRoomAllocation,
  totalRoomAllocated,
} from "./checkout-accommodation";

interface AccommodationStepProps {
  guests: number;
  allocations: RoomAllocations;
  onChange: (allocations: RoomAllocations) => void;
  onViewDetails?: () => void;
  className?: string;
}

function IncludedRoomCard({
  room,
  guests,
  onViewDetails,
  onChangeClick,
}: {
  room: RoomOption;
  guests: number;
  onViewDetails?: () => void;
  onChangeClick: () => void;
}) {
  const roomsLabel = formatRoomAllocationLine(room, guests);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h4 className="font-medium text-charcoal">{room.title}</h4>
              {onViewDetails && (
                <button
                  type="button"
                  onClick={onViewDetails}
                  className="text-sm font-medium text-brand hover:text-brand/80"
                >
                  Подробнее
                </button>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate">{room.description}</p>
            <p className="mt-2 text-sm text-charcoal">
              <span className="font-medium">{formatTourists(guests)}</span>
              <span className="text-slate"> · </span>
              <span className="font-medium">{roomsLabel}</span>
              <span className="text-slate"> · без доплаты</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onChangeClick}
            className="shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-charcoal transition-colors hover:border-brand hover:bg-white hover:text-brand"
          >
            Изменить размещение
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomOptionRow({
  room,
  guests,
  count,
  onViewDetails,
  onCountChange,
  showTopBorder,
}: {
  room: RoomOption;
  guests: number;
  count: number;
  onViewDetails?: () => void;
  onCountChange: (count: number) => void;
  showTopBorder: boolean;
}) {
  const selectId = `room-alloc-${room.id}`;
  const isSelected = count > 0;
  const roomsNeeded = isSelected ? calcRoomsNeeded(count, room) : 0;

  return (
    <div
      className={cn(
        "px-4 py-4 sm:px-5 transition-colors",
        showTopBorder && "border-t border-gray-100",
        isSelected && "bg-brand-light/30 ring-1 ring-inset ring-brand/20"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h4 className={cn("font-medium", isSelected ? "text-charcoal" : "text-charcoal/90")}>
              {room.title}
            </h4>
            {onViewDetails && (
              <button
                type="button"
                onClick={onViewDetails}
                className="text-sm font-medium text-brand hover:text-brand/80"
              >
                Подробнее
              </button>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate">{room.description}</p>
          {isSelected && (
            <p className="mt-1.5 text-xs font-medium text-brand">
              {formatTourists(count)} → {formatRoomCount(roomsNeeded, room.id)}
            </p>
          )}
        </div>

        <div className="shrink-0 text-left sm:w-24 sm:text-center">
          {room.priceUsdPerTraveler === 0 ? (
            <p className="text-sm font-semibold text-charcoal">Включено</p>
          ) : (
            <FormattedPrice
              priceUsd={room.priceUsdPerTraveler}
              className="text-sm font-semibold text-charcoal"
            />
          )}
          <p className="mt-0.5 text-[11px] text-slate">за туриста</p>
        </div>

        <div className="relative shrink-0 sm:w-40">
          <label htmlFor={selectId} className="sr-only">
            {room.title} — количество туристов
          </label>
          <select
            id={selectId}
            value={count}
            onChange={(e) => onCountChange(Number(e.target.value))}
            className={cn(
              "w-full appearance-none rounded-xl border bg-white px-3 py-2.5 pr-9 text-sm text-charcoal transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20",
              isSelected ? "border-brand font-medium" : "border-gray-200"
            )}
          >
            {Array.from({ length: guests + 1 }, (_, n) => (
              <option key={n} value={n}>
                {n === 0 ? "0 туристов" : formatTourists(n)}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}

export default function AccommodationStep({
  guests,
  allocations,
  onChange,
  onViewDetails,
  className,
}: AccommodationStepProps) {
  const allocated = totalRoomAllocated(allocations);
  const allocationStatus = getRoomAllocationStatus(allocations, guests);
  const isComplete = allocationStatus === "complete";
  const isOver = allocationStatus === "over";
  const isDefault = isDefaultRoomAllocation(allocations, guests);
  const [expanded, setExpanded] = useState(false);
  const warningMessage = expanded ? roomAllocationWarning(allocations, guests) : null;

  const includedRoom =
    CHECKOUT_ROOM_OPTIONS.find((room) => room.id === DEFAULT_INCLUDED_ROOM_ID)!;

  useEffect(() => {
    if (!isDefault) setExpanded(true);
  }, [isDefault]);

  return (
    <section className={cn("mx-auto max-w-2xl space-y-4", className)}>
      <div>
        <h3 className="font-display text-lg font-bold text-charcoal">2. Проживание</h3>
        <p className="mt-1 text-sm text-slate">
          {expanded
            ? "Распределите туристов по типам номеров на маршруте"
            : "Стандартное размещение включено в стоимость тура"}
        </p>
        {expanded && (
          <div
            className={cn(
              "mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
              isComplete && "bg-emerald-50 text-emerald-700",
              allocationStatus === "under" && "bg-amber-50 text-amber-800",
              isOver && "bg-red-50 text-red-700"
            )}
          >
            {isComplete ? (
              <>
                <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                Все туристы распределены
              </>
            ) : isOver ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Назначено {formatTourists(allocated)} — в группе {formatTourists(guests)}
              </>
            ) : (
              <>
                Назначено {formatTourists(allocated)} из {formatTourists(guests)}
              </>
            )}
          </div>
        )}
      </div>

      {!expanded ? (
        <IncludedRoomCard
          room={includedRoom}
          guests={guests}
          onViewDetails={onViewDetails}
          onChangeClick={() => setExpanded(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {CHECKOUT_ROOM_OPTIONS.map((room, index) => (
            <RoomOptionRow
              key={room.id}
              room={room}
              guests={guests}
              count={allocations[room.id] ?? 0}
              onViewDetails={onViewDetails}
              onCountChange={(count) =>
                onChange(setRoomAllocation(allocations, room.id, count))
              }
              showTopBorder={index > 0}
            />
          ))}
        </div>
      )}

      {expanded && warningMessage && (
        <div
          role="alert"
          className={cn(
            "flex gap-2.5 rounded-xl px-3.5 py-3 text-sm",
            isOver ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"
          )}
        >
          <AlertTriangle
            className={cn("mt-0.5 h-4 w-4 shrink-0", isOver ? "text-red-600" : "text-amber-600")}
            aria-hidden
          />
          <p>{warningMessage}</p>
        </div>
      )}

      {expanded && isDefault && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-sm font-medium text-slate transition-colors hover:text-charcoal"
        >
          ← Оставить стандартное размещение
        </button>
      )}
    </section>
  );
}
