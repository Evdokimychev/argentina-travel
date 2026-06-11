"use client";

import { useEffect, useState } from "react";
import { Calendar, CircleX, Info, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  buildGroupTourDatesFromBatch,
  computeEndDateFromStart,
  createGroupDateId,
  type OrganizerGroupTourDate,
  type OrganizerPrepaymentType,
} from "@/data/tour-booking-defaults";
import { formatNights } from "@/lib/pluralize";
import { cn } from "@/lib/cn";
import type { CurrencyCode } from "@/types/locale";

interface TripRow {
  id: string;
  startDate: string;
}

interface TourGroupDatesAddModalProps {
  open: boolean;
  durationDays: number;
  durationNights: number;
  currency: CurrencyCode;
  defaultPriceUsd: number;
  onClose: () => void;
  onAdd: (dates: OrganizerGroupTourDate[]) => void;
}

function InfoBanner({
  children,
  tone = "amber",
}: {
  children: React.ReactNode;
  tone?: "amber" | "sky";
}) {
  return (
    <p
      className={cn(
        "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed text-charcoal",
        tone === "amber"
          ? "border border-amber-200/70 bg-amber-50/90"
          : "border border-sky/15 bg-sky/[0.06]"
      )}
    >
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="font-heading text-base font-bold text-charcoal">{children}</h4>;
}

function FormField({
  id,
  label,
  hint,
  children,
  className,
}: {
  id?: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-charcoal">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-[11px] leading-relaxed text-slate">{hint}</p> : null}
    </div>
  );
}

function DateInput({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative min-w-0">
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-0 z-10 -translate-y-1/2 bg-[#f4f8fc] px-1 text-[11px] font-medium text-slate"
      >
        {label}
      </label>
      <Input
        id={id}
        type="date"
        value={value}
        readOnly={disabled}
        disabled={disabled}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className={cn(
          "h-12 pr-10 pt-1",
          disabled ? "cursor-not-allowed border-gray-200 bg-gray-100 text-slate" : "bg-white"
        )}
      />
      <Calendar
        className={cn(
          "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2",
          disabled ? "text-slate/50" : "text-slate"
        )}
        aria-hidden
      />
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  hint,
  compact,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-start gap-3 text-left transition-colors",
        compact
          ? "rounded-xl px-1 py-1"
          : "rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-3 hover:border-gray-200"
      )}
    >
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-charcoal">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-slate">{hint}</span>
        ) : null}
      </span>
    </div>
  );
}

function createTripRow(): TripRow {
  return { id: createGroupDateId(), startDate: "" };
}

function createInitialForm(defaultPriceUsd: number) {
  return {
    trips: [createTripRow()],
    repeatDepartures: false,
    priceUsd: defaultPriceUsd,
    fullPaymentDaysBefore: 0,
    prepaymentAmount: 15,
    prepaymentType: "percent" as OrganizerPrepaymentType,
    applyDiscount: false,
    totalSeats: 0,
    spotsLeft: 0,
    notGuaranteed: false,
    flightIncluded: false,
  };
}

export default function TourGroupDatesAddModal({
  open,
  durationDays,
  durationNights,
  currency,
  defaultPriceUsd,
  onClose,
  onAdd,
}: TourGroupDatesAddModalProps) {
  const [form, setForm] = useState(() => createInitialForm(defaultPriceUsd));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(createInitialForm(defaultPriceUsd));
    setError(null);
  }, [open, defaultPriceUsd]);

  function updateTrip(id: string, startDate: string) {
    setForm((current) => ({
      ...current,
      trips: current.trips.map((trip) => (trip.id === id ? { ...trip, startDate } : trip)),
    }));
  }

  function removeTrip(id: string) {
    setForm((current) => ({
      ...current,
      trips: current.trips.length === 1 ? current.trips : current.trips.filter((trip) => trip.id !== id),
    }));
  }

  function addTrip() {
    setForm((current) => ({
      ...current,
      trips: [...current.trips, createTripRow()],
    }));
  }

  function handleSubmit() {
    const startDates = form.trips.map((trip) => trip.startDate).filter(Boolean);
    if (!startDates.length) {
      setError("Укажите дату начала хотя бы для одного заезда");
      return;
    }

    if (form.priceUsd <= 0) {
      setError("Укажите стоимость тура за одного туриста");
      return;
    }

    onAdd(
      buildGroupTourDatesFromBatch({
        startDates,
        durationDays,
        priceUsd: form.priceUsd,
        totalSeats: form.totalSeats,
        spotsLeft: form.spotsLeft,
        fullPaymentDaysBefore: form.fullPaymentDaysBefore,
        prepaymentAmount: form.prepaymentAmount,
        prepaymentType: form.prepaymentType,
        applyDiscount: form.applyDiscount,
        notGuaranteed: form.notGuaranteed,
        flightIncluded: form.flightIncluded,
      })
    );
    onClose();
  }

  const currencySuffix = currency === "USD" ? "US$" : currency;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="flex max-h-[92vh] max-w-2xl flex-col overflow-hidden border border-gray-200 p-0"
        onPointerDownOutside={onClose}
        onEscapeKeyDown={onClose}
      >
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <DialogTitle className="text-lg sm:text-xl">Добавление групповых дат</DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate transition-colors hover:bg-gray-100 hover:text-charcoal"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
          <div className="space-y-5">
            <InfoBanner tone="amber">
              Дата завершения заполняется автоматически исходя из количества ночей, указанного в
              туре ({formatNights(durationNights)}). Если длительность дат в туре отличается —
              создайте копию тура.
            </InfoBanner>

            <div className="space-y-3 rounded-2xl border border-sky/10 bg-[#f4f8fc] p-3.5 sm:p-4">
              {form.trips.map((trip, index) => {
                const endDate = computeEndDateFromStart(trip.startDate, durationDays);

                return (
                  <div
                    key={trip.id}
                    className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_auto] sm:gap-3"
                  >
                    <span className="text-xs font-semibold tabular-nums text-slate">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <DateInput
                      id={`trip-start-${trip.id}`}
                      label="Дата начала"
                      value={trip.startDate}
                      onChange={(value) => updateTrip(trip.id, value)}
                    />
                    <DateInput
                      id={`trip-end-${trip.id}`}
                      label="Дата завершения"
                      value={endDate}
                      disabled
                    />
                    <button
                      type="button"
                      onClick={() => removeTrip(trip.id)}
                      disabled={form.trips.length === 1}
                      className="inline-flex h-10 w-10 items-center justify-center self-center rounded-lg text-slate transition-colors hover:bg-white hover:text-brand disabled:cursor-not-allowed disabled:opacity-35 sm:h-12"
                      aria-label="Удалить заезд"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}

              <label className="flex cursor-pointer items-center gap-2.5 px-1 pt-1 text-sm text-charcoal">
                <input
                  type="checkbox"
                  checked={form.repeatDepartures}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, repeatDepartures: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 accent-brand"
                />
                Повторить заезд несколько раз
              </label>

              <button
                type="button"
                onClick={addTrip}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand/25 bg-white/70 px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:border-brand/40 hover:bg-white"
              >
                <Plus className="h-4 w-4" />
                Добавить ещё заезд
              </button>
            </div>

            <section className="space-y-3 border-t border-gray-100 pt-5">
              <SectionTitle>Стоимость и предоплата</SectionTitle>
              <InfoBanner tone="sky">
                Настройки применяются ко всем датам. Чтобы изменить конкретный заезд — отредактируйте
                его после добавления дат.
              </InfoBanner>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="group-batch-price"
                  label="Стоимость тура за одного туриста"
                  hint="Согласно политике паритета цен, стоимость тура на сайте не должна быть выше, чем на других площадках"
                >
                  <div className="relative">
                    <Input
                      id="group-batch-price"
                      type="number"
                      min={0}
                      value={form.priceUsd || ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          priceUsd: Number(event.target.value) || 0,
                        }))
                      }
                      className="pr-14"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate">
                      {currencySuffix}
                    </span>
                  </div>
                </FormField>

                <FormField
                  id="group-batch-payment-days"
                  label="Срок полной оплаты"
                  hint="Укажите количество дней до начала тура. Укажите 0, если оплата производится на месте"
                >
                  <Input
                    id="group-batch-payment-days"
                    type="number"
                    min={0}
                    value={form.fullPaymentDaysBefore}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fullPaymentDaysBefore: Number(event.target.value) || 0,
                      }))
                    }
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_88px] sm:items-start">
                <FormField
                  id="group-batch-prepayment"
                  label="Размер предоплаты"
                  hint="Минимальный размер — 15%"
                >
                  <Input
                    id="group-batch-prepayment"
                    type="number"
                    min={0}
                    value={form.prepaymentAmount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        prepaymentAmount: Number(event.target.value) || 0,
                      }))
                    }
                  />
                </FormField>
                <FormField id="group-batch-prepayment-type" label="Тип">
                  <select
                    id="group-batch-prepayment-type"
                    value={form.prepaymentType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        prepaymentType: event.target.value as OrganizerPrepaymentType,
                      }))
                    }
                    className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-charcoal focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="percent">%</option>
                    <option value="fixed">{currencySuffix}</option>
                  </select>
                </FormField>
              </div>

              <ToggleSwitch
                compact
                checked={form.applyDiscount}
                onChange={(applyDiscount) => setForm((current) => ({ ...current, applyDiscount }))}
                label="Применить к стоимости скидку"
              />
            </section>

            <section className="space-y-3 border-t border-gray-100 pt-5">
              <SectionTitle>Места</SectionTitle>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="group-batch-total-seats" label="Количество мест всего">
                  <Input
                    id="group-batch-total-seats"
                    type="number"
                    min={0}
                    value={form.totalSeats || ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        totalSeats: Number(event.target.value) || 0,
                      }))
                    }
                  />
                </FormField>
                <FormField id="group-batch-spots-left" label="Свободных мест">
                  <Input
                    id="group-batch-spots-left"
                    type="number"
                    min={0}
                    value={form.spotsLeft || ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        spotsLeft: Number(event.target.value) || 0,
                      }))
                    }
                  />
                </FormField>
              </div>

              <div className="space-y-1 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2">
                <ToggleSwitch
                  compact
                  checked={form.notGuaranteed}
                  onChange={(notGuaranteed) =>
                    setForm((current) => ({ ...current, notGuaranteed }))
                  }
                  label="Тур не гарантирован"
                  hint="Тур в эти даты под вопросом (предварительная дата)"
                />
                <ToggleSwitch
                  compact
                  checked={form.flightIncluded}
                  onChange={(flightIncluded) =>
                    setForm((current) => ({ ...current, flightIncluded }))
                  }
                  label="В стоимость включён перелёт"
                />
              </div>
            </section>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-brand">
                {error}
              </p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-gray-100 bg-gray-50/40 px-5 py-4 sm:px-6">
          <p className="mb-3 flex items-start gap-2 text-xs leading-relaxed text-slate">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
            Даты будут добавлены в тур сразу после нажатия кнопки «Добавить».
          </p>
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="gap-1.5 sm:min-w-[132px]">
              <CircleX className="h-4 w-4" />
              Отменить
            </Button>
            <Button type="button" onClick={handleSubmit} className="gap-1.5 sm:min-w-[132px]">
              <Plus className="h-4 w-4" />
              Добавить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
