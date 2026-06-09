"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, ChevronDown, RotateCcw } from "lucide-react";
import FormattedPrice from "@/components/FormattedPrice";
import { cn } from "@/lib/cn";
import { formatTourists } from "@/lib/pluralize";
import { TRANSFER_VEHICLE_OPTIONS, minTransferVehiclePriceUsd, transferVehicleCount } from "./checkout-addons";
import {
  calcTransferLineTotal,
  calcTransferTotalFromAllocations,
  createDefaultTransferAllocations,
  EMPTY_TRANSFER_ALLOCATIONS,
  formatTransferAllocationLine,
  formatVehicleCount,
  getTransferAllocationStatus,
  isDefaultTransferAllocation,
  isTransferEnabled,
  setTransferAllocation,
  totalTransferAllocated,
  transferAllocationWarning,
  type TransferAllocations,
  type TransferVehicleId,
} from "./checkout-transfer";

import TransferVehicleThumbnail from "./TransferVehicleThumbnail";

interface TransferAddonPickerProps {
  guests: number;
  allocations: TransferAllocations;
  onChange: (allocations: TransferAllocations) => void;
}

function DefaultTransferCard({
  allocations,
  onChangeClick,
}: {
  allocations: TransferAllocations;
  onChangeClick: () => void;
}) {
  const activeVehicle = TRANSFER_VEHICLE_OPTIONS.find(
    (vehicle) => (allocations[vehicle.id as TransferVehicleId] ?? 0) > 0
  );
  if (!activeVehicle) return null;

  const passengers = allocations[activeVehicle.id as TransferVehicleId];
  const vehiclesLabel = formatTransferAllocationLine(activeVehicle, passengers);
  const lineTotal = calcTransferLineTotal(passengers, activeVehicle);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <TransferVehicleThumbnail vehicle={activeVehicle} />
            <div className="min-w-0 flex-1">
            <h4 className="font-medium text-charcoal">{activeVehicle.title}</h4>
            <p className="mt-1 text-sm text-slate">
              до {activeVehicle.capacity} пасс. ·{" "}
              <FormattedPrice priceUsd={activeVehicle.priceUsd} className="text-sm text-slate" /> /
              машина
            </p>
            <p className="mt-2 text-sm text-charcoal">
              <span className="font-medium">{formatTourists(passengers)}</span>
              <span className="text-slate"> · </span>
              <span className="font-medium">{vehiclesLabel}</span>
              <span className="text-slate"> · </span>
              <FormattedPrice priceUsd={lineTotal} className="text-sm font-medium text-charcoal" />
            </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onChangeClick}
            className="shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-charcoal transition-colors hover:border-brand hover:bg-white hover:text-brand"
          >
            Изменить транспорт
          </button>
        </div>
      </div>
    </div>
  );
}

function TransferVehicleRow({
  guests,
  count,
  vehicle,
  onCountChange,
  showTopBorder,
}: {
  guests: number;
  count: number;
  vehicle: (typeof TRANSFER_VEHICLE_OPTIONS)[number];
  onCountChange: (count: number) => void;
  showTopBorder: boolean;
}) {
  const selectId = `transfer-alloc-${vehicle.id}`;
  const isSelected = count > 0;
  const vehiclesNeeded = isSelected ? transferVehicleCount(count, vehicle.capacity) : 0;
  const lineTotal = isSelected ? calcTransferLineTotal(count, vehicle) : 0;

  return (
    <div
      className={cn(
        "px-4 py-3 transition-colors",
        showTopBorder && "border-t border-gray-100",
        isSelected && "bg-brand-light/30 ring-1 ring-inset ring-brand/20"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <TransferVehicleThumbnail vehicle={vehicle} />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium text-charcoal">{vehicle.title}</h4>
            <p className="mt-0.5 text-xs text-slate">
              до {vehicle.capacity} пасс. ·{" "}
              <FormattedPrice priceUsd={vehicle.priceUsd} className="text-xs text-slate" /> / машина
            </p>
            {isSelected && (
              <p className="mt-1.5 text-xs font-medium text-brand">
                {formatTourists(count)} → {formatVehicleCount(vehiclesNeeded)} ·{" "}
                <FormattedPrice priceUsd={lineTotal} className="text-xs font-medium" />
              </p>
            )}
          </div>
        </div>

        <div className="relative shrink-0 sm:w-36 sm:pl-0 pl-[calc(5.5rem+0.75rem)]">
          <label htmlFor={selectId} className="sr-only">
            {vehicle.title} — количество туристов
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

export default function TransferAddonPicker({
  guests,
  allocations,
  onChange,
}: TransferAddonPickerProps) {
  const enabled = isTransferEnabled(allocations);
  const allocated = totalTransferAllocated(allocations);
  const allocationStatus = getTransferAllocationStatus(allocations, guests);
  const isComplete = allocationStatus === "complete";
  const isOver = allocationStatus === "over";
  const isDefault = isDefaultTransferAllocation(allocations, guests);
  const [expanded, setExpanded] = useState(false);
  const warningMessage = enabled && expanded ? transferAllocationWarning(allocations, guests) : null;
  const transferTotal = calcTransferTotalFromAllocations(allocations);
  const minTransferPriceUsd = minTransferVehiclePriceUsd();

  useEffect(() => {
    if (enabled && !isDefault) setExpanded(true);
  }, [enabled, isDefault]);

  function handleToggle(checked: boolean) {
    if (checked) {
      onChange(createDefaultTransferAllocations(guests));
      setExpanded(false);
    } else {
      onChange(EMPTY_TRANSFER_ALLOCATIONS);
      setExpanded(false);
    }
  }

  function handleResetAllocations() {
    onChange(EMPTY_TRANSFER_ALLOCATIONS);
  }

  return (
    <li>
      <div
        className={cn(
          "rounded-xl border transition-all",
          enabled ? "border-gray-200 bg-white" : "border-gray-200"
        )}
      >
        <label className="flex cursor-pointer gap-3 p-4">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="mt-1 h-4 w-4 accent-brand"
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-start justify-between gap-3">
              <span className="font-medium text-charcoal">Трансфер из аэропорта</span>
              <span className="shrink-0 text-right text-sm font-semibold text-charcoal">
                {!enabled ? (
                  <>
                    <span className="text-[11px] font-normal text-slate">от </span>
                    <FormattedPrice
                      priceUsd={minTransferPriceUsd}
                      className="text-sm font-semibold"
                    />
                    <span className="block text-[11px] font-normal text-slate">за машину</span>
                  </>
                ) : (
                  <>
                    <FormattedPrice priceUsd={transferTotal} className="text-sm font-semibold" />
                    <span className="block text-[11px] font-normal text-slate">итого</span>
                  </>
                )}
              </span>
            </span>
            <span className="mt-1 block text-sm text-slate">
              Встреча в аэропорту и доставка до отеля или места начала тура. Распределите группу
              по типам транспорта — для каждого типа можно указать своё количество машин.
            </span>
          </span>
        </label>

        {enabled && (
          <div className="border-t border-gray-100 px-4 pb-4 pt-3">
            {!expanded ? (
              <DefaultTransferCard
                allocations={allocations}
                onChangeClick={() => setExpanded(true)}
              />
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium text-charcoal">Тип транспорта</p>
                    {allocated > 0 && (
                      <button
                        type="button"
                        onClick={handleResetAllocations}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-slate transition-colors hover:border-gray-300 hover:text-charcoal"
                      >
                        <RotateCcw className="h-3 w-3 shrink-0" aria-hidden />
                        Сбросить
                      </button>
                    )}
                  </div>
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                      isComplete && "bg-emerald-50 text-emerald-700",
                      allocationStatus === "under" && "bg-amber-50 text-amber-800",
                      isOver && "bg-red-50 text-red-700"
                    )}
                  >
                    {isComplete ? (
                      <>
                        <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden />
                        Все туристы распределены
                      </>
                    ) : isOver ? (
                      <>
                        <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
                        {formatTourists(allocated)} — в группе {formatTourists(guests)}
                      </>
                    ) : (
                      <>
                        {formatTourists(allocated)} из {formatTourists(guests)}
                      </>
                    )}
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  {TRANSFER_VEHICLE_OPTIONS.map((vehicle, index) => (
                    <TransferVehicleRow
                      key={vehicle.id}
                      guests={guests}
                      count={allocations[vehicle.id as TransferVehicleId] ?? 0}
                      vehicle={vehicle}
                      onCountChange={(passengers) =>
                        onChange(
                          setTransferAllocation(
                            allocations,
                            vehicle.id as TransferVehicleId,
                            passengers
                          )
                        )
                      }
                      showTopBorder={index > 0}
                    />
                  ))}
                </div>

                {warningMessage && (
                  <div
                    role="alert"
                    className={cn(
                      "flex gap-2.5 rounded-xl px-3 py-2.5 text-xs",
                      isOver ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"
                    )}
                  >
                    <AlertTriangle
                      className={cn(
                        "mt-0.5 h-3.5 w-3.5 shrink-0",
                        isOver ? "text-red-600" : "text-amber-600"
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p>{warningMessage}</p>
                      {allocated > 0 && (
                        <button
                          type="button"
                          onClick={handleResetAllocations}
                          className="mt-1.5 inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline"
                        >
                          <RotateCcw className="h-3 w-3 shrink-0" aria-hidden />
                          Сбросить количество
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {isDefault && (
                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="text-xs font-medium text-slate transition-colors hover:text-charcoal"
                  >
                    ← Оставить рекомендуемый транспорт
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
