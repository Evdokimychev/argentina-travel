"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Calendar, CircleX, Globe2, Info, Save, Users, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { computeEndDateFromStart } from "@/data/tour-booking-defaults";
import {
  BOOKING_PAYMENT_PROCEDURE_LABELS,
  BOOKING_PAYMENT_STATUS_LABELS,
  buildBookingEditForm,
  getTouristStatusLines,
  recalculateBookingTotal,
} from "@/lib/booking-params";
import { updateOrganizerBookingDetails } from "@/lib/bookings-store";
import {
  getOrganizerTourListingsForUser,
  readOrganizerTourDraft,
} from "@/lib/organizer-tour-store";
import { getCatalogSlug } from "@/lib/tour-slug";
import { getTourDetail } from "@/lib/tours";
import type { Booking } from "@/types/tourist";
import type { BookingOrganizerEditForm } from "@/types/booking-params";
import type { CurrencyCode } from "@/types/locale";
import { cn } from "@/lib/cn";

interface BookingOrganizerEditModalProps {
  booking: Booking;
  open: boolean;
  onClose: () => void;
}

const CURRENCY_OPTIONS: Array<{ value: CurrencyCode; label: string }> = [
  { value: "USD", label: "Доллар США, USD" },
  { value: "EUR", label: "Евро, EUR" },
  { value: "RUB", label: "Российский рубль, RUB" },
];

const selectClassName =
  "flex h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-charcoal focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

function SectionTitle({ children }: { children: ReactNode }) {
  return <h4 className="font-heading text-base font-bold text-charcoal">{children}</h4>;
}

function FormField({
  id,
  label,
  hint,
  required,
  children,
  className,
}: {
  id?: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-charcoal">
        {label}
        {required ? <span className="text-brand"> *</span> : null}
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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
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
        onChange={(event) => onChange(event.target.value)}
        className="h-12 bg-white pr-10 pt-1"
      />
      <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
    </div>
  );
}

function PriceSuffixInput({
  id,
  label,
  value,
  suffix,
  onChange,
  readOnly,
}: {
  id: string;
  label: string;
  value: number | string;
  suffix: string;
  onChange?: (value: number) => void;
  readOnly?: boolean;
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
        type="number"
        min={0}
        readOnly={readOnly}
        value={value}
        onChange={
          onChange
            ? (event) => onChange(Number(event.target.value) || 0)
            : undefined
        }
        className={cn("h-12 bg-white pr-14 pt-1", readOnly && "bg-gray-50 text-charcoal")}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate">
        {suffix}
      </span>
    </div>
  );
}

export default function BookingOrganizerEditModal({
  booking,
  open,
  onClose,
}: BookingOrganizerEditModalProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<BookingOrganizerEditForm>(() => buildBookingEditForm(booking));
  const [durationDays, setDurationDays] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tourOptions = useMemo(
    () => (user ? getOrganizerTourListingsForUser(user.id) : []),
    [user]
  );

  useEffect(() => {
    if (!open) return;
    setForm(buildBookingEditForm(booking));
    setError(null);
    setLoading(false);

    if (booking.organizerTourId && user) {
      const draft = readOrganizerTourDraft(booking.organizerTourId, user);
      if (draft) setDurationDays(Math.max(1, draft.durationDays));
    }
  }, [open, booking, user]);

  const currencySuffix =
    form.organizerParams.currency === "USD" ? "US$" : form.organizerParams.currency;
  const touristLines = getTouristStatusLines({
    guests: form.guests,
    travelers: booking.travelers,
  });

  function patchForm(patch: Partial<BookingOrganizerEditForm>) {
    setForm((current) => ({ ...current, ...patch }));
    setError(null);
  }

  function patchParams(patch: Partial<BookingOrganizerEditForm["organizerParams"]>) {
    setForm((current) => ({
      ...current,
      organizerParams: { ...current.organizerParams, ...patch },
    }));
    setError(null);
  }

  function handleTourChange(organizerTourId: string) {
    const listing = tourOptions.find((item) => item.id === organizerTourId);
    if (!listing || !user) return;

    const draft = readOrganizerTourDraft(listing.id, user);
    const catalogSlug = getCatalogSlug(listing);
    const tourDetail = getTourDetail(catalogSlug);
    const pricePerGuestUsd = draft?.priceUsd ?? Math.round(form.totalPriceUsd / form.guests);
    const nextDurationDays = Math.max(1, draft?.durationDays ?? durationDays);
    const endDate =
      form.startDate && nextDurationDays
        ? computeEndDateFromStart(form.startDate, nextDurationDays)
        : form.endDate;

    setDurationDays(nextDurationDays);
    patchForm({
      organizerTourId: listing.id,
      tourId: tourDetail?.id ?? listing.id,
      tourSlug: catalogSlug,
      tourTitle: listing.title,
      tourImage: listing.image,
      totalPriceUsd: recalculateBookingTotal(pricePerGuestUsd, form.guests),
      endDate,
      organizerParams: {
        ...form.organizerParams,
        pricePerGuestUsd,
        currency: draft?.priceCurrency ?? form.organizerParams.currency,
      },
    });
  }

  function handleGuestsChange(nextGuests: number) {
    const guests = Math.max(1, nextGuests);
    patchForm({
      guests,
      totalPriceUsd: recalculateBookingTotal(form.organizerParams.pricePerGuestUsd, guests),
    });
  }

  function handlePricePerGuestChange(pricePerGuestUsd: number) {
    patchForm({
      organizerParams: { ...form.organizerParams, pricePerGuestUsd },
      totalPriceUsd: recalculateBookingTotal(pricePerGuestUsd, form.guests),
    });
  }

  function handleStartDateChange(startDate: string) {
    const endDate =
      startDate && durationDays
        ? computeEndDateFromStart(startDate, durationDays)
        : form.endDate;
    patchForm({ startDate, endDate });
  }

  async function handleSubmit() {
    if (!user) {
      setError("Требуется авторизация организатора");
      return;
    }

    setLoading(true);
    setError(null);

    const result = updateOrganizerBookingDetails({
      bookingId: booking.id,
      actor: user,
      contactName: form.contactName,
      guests: form.guests,
      paymentStatus: form.paymentStatus,
      organizerTourId: form.organizerTourId || undefined,
      tourId: form.tourId,
      tourSlug: form.tourSlug,
      tourTitle: form.tourTitle,
      tourImage: form.tourImage,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      totalPriceUsd: form.totalPriceUsd,
      organizerParams: form.organizerParams,
    });

    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="flex max-h-[92vh] max-w-2xl flex-col overflow-hidden border border-gray-200 p-0"
        onPointerDownOutside={onClose}
        onEscapeKeyDown={onClose}
      >
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <DialogTitle className="text-lg sm:text-xl">
            Редактирование параметров бронирования
          </DialogTitle>
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
          <div className="space-y-6">
            <FormField id="booking-payment-status" label="Статус бронирования">
              <NativeSelect
                id="booking-payment-status"
                value={form.paymentStatus}
                onChange={(event) =>
                  patchForm({
                    paymentStatus: event.target.value as BookingOrganizerEditForm["paymentStatus"],
                  })
                }
                className={selectClassName}
              >
                {(Object.keys(BOOKING_PAYMENT_STATUS_LABELS) as Array<
                  keyof typeof BOOKING_PAYMENT_STATUS_LABELS
                >).map((key) => (
                  <option key={key} value={key}>
                    {BOOKING_PAYMENT_STATUS_LABELS[key]}
                  </option>
                ))}
              </NativeSelect>
            </FormField>

            <section className="space-y-3">
              <SectionTitle>Информация о заказчике</SectionTitle>
              <FormField id="booking-contact-name" label="ФИО заказчика" required>
                <Input
                  id="booking-contact-name"
                  value={form.contactName}
                  placeholder="Данные не заполнены"
                  onChange={(event) => patchForm({ contactName: event.target.value })}
                />
              </FormField>
            </section>

            <section className="space-y-3">
              <SectionTitle>Туристы</SectionTitle>
              <FormField id="booking-guests" label="Количество туристов">
                <div className="relative">
                  <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
                  <Input
                    id="booking-guests"
                    type="number"
                    min={1}
                    value={form.guests}
                    onChange={(event) => handleGuestsChange(Number(event.target.value) || 1)}
                    className="pl-10"
                  />
                </div>
              </FormField>
              <ol className="space-y-1.5 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3 text-sm text-slate">
                {touristLines.map((line, index) => (
                  <li key={index}>
                    {index + 1}. {line}
                  </li>
                ))}
              </ol>
              <p className="text-[11px] leading-relaxed text-slate">
                Подробные данные участников редактируются в блоке «Информация о туристах» на
                странице заявки.
              </p>
            </section>

            <section className="space-y-4">
              <SectionTitle>Информация о туре</SectionTitle>

              <FormField id="booking-tour-select" label="Выбрать тур/экскурсию">
                <div className="relative">
                  <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
                  <NativeSelect
                    id="booking-tour-select"
                    value={form.organizerTourId}
                    onChange={(event) => handleTourChange(event.target.value)}
                    className={cn(selectClassName, "pl-10")}
                  >
                    <option value="">
                      {form.tourTitle || "Выберите тур"}
                    </option>
                    {form.organizerTourId &&
                    !tourOptions.some((tour) => tour.id === form.organizerTourId) ? (
                      <option value={form.organizerTourId}>{form.tourTitle}</option>
                    ) : null}
                    {tourOptions.map((tour) => (
                      <option key={tour.id} value={tour.id}>
                        {tour.title}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </FormField>

              <div className="space-y-4 rounded-2xl border border-sky/10 bg-[#f4f8fc] p-3.5 sm:p-4">
                <p className="text-sm font-semibold text-charcoal">Индивидуальный тур</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DateInput
                    id="booking-start-date"
                    label="Дата начала"
                    value={form.startDate}
                    onChange={handleStartDateChange}
                  />
                  <DateInput
                    id="booking-end-date"
                    label="Дата завершения"
                    value={form.endDate}
                    onChange={(value) => patchForm({ endDate: value })}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <PriceSuffixInput
                    id="booking-price-per-guest"
                    label="Стоимость за одного туриста"
                    value={form.organizerParams.pricePerGuestUsd || ""}
                    suffix={currencySuffix}
                    onChange={handlePricePerGuestChange}
                  />
                  <FormField id="booking-currency" label="Валюта">
                    <NativeSelect
                      id="booking-currency"
                      value={form.organizerParams.currency}
                      onChange={(event) =>
                        patchParams({ currency: event.target.value as CurrencyCode })
                      }
                      className={selectClassName}
                    >
                      {CURRENCY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                </div>

                <PriceSuffixInput
                  id="booking-total-price"
                  label="Стоимость на всех туристов"
                  value={form.totalPriceUsd}
                  suffix={currencySuffix}
                  readOnly
                />
              </div>

              <FormField id="booking-payment-procedure" label="Порядок оплаты">
                <NativeSelect
                  id="booking-payment-procedure"
                  value={form.organizerParams.paymentProcedure}
                  onChange={(event) =>
                    patchParams({
                      paymentProcedure: event.target
                        .value as BookingOrganizerEditForm["organizerParams"]["paymentProcedure"],
                    })
                  }
                  className={selectClassName}
                >
                  {Object.entries(BOOKING_PAYMENT_PROCEDURE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  id="booking-prepayment-amount"
                  label="Размер предоплаты на всех туристов"
                >
                  <Input
                    id="booking-prepayment-amount"
                    type="number"
                    min={0}
                    value={form.organizerParams.prepaymentAmount}
                    onChange={(event) =>
                      patchParams({ prepaymentAmount: Number(event.target.value) || 0 })
                    }
                  />
                </FormField>
                <FormField id="booking-prepayment-type" label="Тип предоплаты">
                  <NativeSelect
                    id="booking-prepayment-type"
                    value={form.organizerParams.prepaymentType}
                    onChange={(event) =>
                      patchParams({
                        prepaymentType: event.target.value as "percent" | "fixed",
                      })
                    }
                    className={selectClassName}
                  >
                    <option value="percent">%</option>
                    <option value="fixed">{currencySuffix}</option>
                  </NativeSelect>
                </FormField>
              </div>

              <p className="flex items-start gap-2 rounded-xl border border-amber-200/70 bg-amber-50/90 px-3.5 py-2.5 text-sm leading-relaxed text-charcoal">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                По умолчанию предоплата составляет 15% (сервисный сбор), остаток турист может
                внести на месте.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  id="booking-prepayment-deadline"
                  label="Срок внесения предоплаты"
                  hint="Укажите количество дней с момента подтверждения бронирования."
                >
                  <Input
                    id="booking-prepayment-deadline"
                    type="number"
                    min={0}
                    value={form.organizerParams.prepaymentDeadlineDays}
                    onChange={(event) =>
                      patchParams({
                        prepaymentDeadlineDays: Number(event.target.value) || 0,
                      })
                    }
                  />
                </FormField>
                <FormField
                  id="booking-full-payment-deadline"
                  label="Срок полной оплаты"
                  hint="Укажите количество дней до начала тура. 0 — оплата на месте."
                >
                  <Input
                    id="booking-full-payment-deadline"
                    type="number"
                    min={0}
                    value={form.organizerParams.fullPaymentDaysBefore}
                    onChange={(event) =>
                      patchParams({
                        fullPaymentDaysBefore: Number(event.target.value) || 0,
                      })
                    }
                  />
                </FormField>
              </div>

              <FormField
                id="booking-accommodation-terms"
                label="Условия размещения"
                hint="Необязательное поле. Укажите названия отелей, типы номеров, доплаты за одноместное размещение."
              >
                <Textarea
                  id="booking-accommodation-terms"
                  rows={4}
                  value={form.organizerParams.accommodationTerms ?? ""}
                  onChange={(event) => patchParams({ accommodationTerms: event.target.value })}
                />
              </FormField>
            </section>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-brand">
                {error}
              </p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-gray-100 bg-gray-50/40 px-5 py-4 sm:px-6">
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="gap-1.5 sm:min-w-[160px]"
            >
              <CircleX className="h-4 w-4" />
              Отменить
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="gap-1.5 sm:min-w-[200px]"
            >
              <Save className="h-4 w-4" />
              {loading ? "Сохранение…" : "Сохранить изменения"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
