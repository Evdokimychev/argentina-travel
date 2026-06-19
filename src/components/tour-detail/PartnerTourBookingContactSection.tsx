"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardCheck, ExternalLink, Pencil, Users, UsersRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { contactFieldsFromAuthUser, splitFullName } from "@/components/tour-detail/checkout/checkout-contact";
import { createInitialCheckoutForm } from "@/components/tour-detail/checkout/types";
import type { SessionUser } from "@/types/user";
import { validateBookingDates } from "@/components/tour-detail/BookingDateSelector";
import { useTourBooking } from "@/components/tour-detail/TourBookingContext";
import BookingGuestLoginHint from "@/components/booking/BookingGuestLoginHint";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { cn } from "@/lib/cn";
import { normalizeSiteError } from "@/lib/site-feedback/normalize-error";
import { formatDateRange } from "@/lib/utils";
import { formatTourists } from "@/lib/pluralize";
import { parsePartnerTourDateId } from "@/lib/tripster/partner-tour-price";
import { buildTripsterBookingContactPayload } from "@/lib/tripster/booking-contact";
import {
  openPartnerBookingUrl,
  resolveTripsterFallbackDescription,
} from "@/lib/tripster/open-partner-booking-url";
import type { TourDetail } from "@/types";

function RequiredMark() {
  return (
    <span className="text-brand" aria-hidden="true">
      {" "}
      *
    </span>
  );
}


function PreviewEditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute right-1.5 top-1.5 rounded-lg p-1.5 text-slate opacity-0 transition-opacity hover:bg-white/90 hover:text-sky focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 group-hover:opacity-100 group-focus-within:opacity-100"
    >
      <Pencil className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}

function PartnerTourBookingPreviewCard({
  dateLabel,
  guestsLabel,
  spotsLeft,
  priceLabel,
  perPersonLabel,
  onEditDate,
  onEditGuests,
}: {
  dateLabel: string;
  guestsLabel: string;
  spotsLeft?: number;
  priceLabel: string;
  perPersonLabel?: string;
  onEditDate?: () => void;
  onEditGuests?: () => void;
}) {
  return (
    <section
      aria-label="Предпросмотр заявки"
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card"
    >
      <div className="flex items-start gap-3 border-b border-gray-100 bg-gradient-to-r from-sky/[0.06] to-white px-4 py-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky">
          <ClipboardCheck className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-charcoal">Предпросмотр заявки</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-slate">
            Проверьте дату, состав группы и сумму перед отправкой
          </p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="group relative flex items-start gap-3 rounded-xl border border-sky/15 bg-sky/[0.04] px-3.5 py-3 pr-10">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sky shadow-sm">
            <CalendarDays className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-slate">Дата заезда</p>
            <p className="mt-0.5 text-sm font-semibold leading-snug text-charcoal">{dateLabel}</p>
          </div>
          {onEditDate ? <PreviewEditButton label="Изменить дату заезда" onClick={onEditDate} /> : null}
        </div>

        <div className="rounded-xl border border-gray-100 bg-surface-muted/35 px-3.5 py-3">
          <div
            className={cn(
              "flex items-stretch",
              spotsLeft != null && "divide-x divide-gray-200/80"
            )}
          >
            <div className="group relative flex min-w-0 flex-1 items-start gap-2.5 pr-3">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-slate" aria-hidden />
              <div className="min-w-0 pr-6">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate">Туристы</p>
                <p className="mt-0.5 text-sm font-semibold leading-snug text-charcoal">{guestsLabel}</p>
              </div>
              {onEditGuests ? (
                <PreviewEditButton label="Изменить число туристов" onClick={onEditGuests} />
              ) : null}
            </div>
            {spotsLeft != null ? (
              <div className="flex min-w-0 flex-1 items-start gap-2.5 pl-3">
                <UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-slate" aria-hidden />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate">Свободно</p>
                  <p className="mt-0.5 text-sm font-semibold leading-snug text-charcoal">{spotsLeft}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 border-t border-gray-100 bg-gray-50/70 px-4 py-3.5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate">Стоимость</p>
          {perPersonLabel ? (
            <p className="mt-1 text-[11px] leading-snug text-slate">{perPersonLabel}</p>
          ) : null}
        </div>
        <p className="text-right font-heading text-xl font-bold leading-none text-charcoal">{priceLabel}</p>
      </div>
    </section>
  );
}

function createPartnerContactForm(guests: number, user?: SessionUser | null) {
  const base = createInitialCheckoutForm(guests);
  const autofill = user ? contactFieldsFromAuthUser(user) : null;
  const fullName = autofill
    ? [autofill.contactFirstName, autofill.contactLastName]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(" ")
    : [base.contactFirstName, base.contactLastName]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(" ");

  return {
    contactFullName: fullName,
    contactEmail: autofill?.contactEmail ?? base.contactEmail,
    contactPhone: autofill?.contactPhone ?? base.contactPhone,
    comments: "",
  };
}

export default function PartnerTourBookingContactSection({
  tour,
}: {
  tour: TourDetail;
}) {
  const { user } = useAuth();
  const feedback = useSiteFeedback();
  const {
    guests,
    dateMode,
    customDate,
    selectedDateId,
    partnerBookingPrice,
    scheduleDates,
    closePartnerBookingPreview,
    externalBookingHref,
    requestPartnerBookingEdit,
  } = useTourBooking();

  const availableDates = scheduleDates.length > 0 ? scheduleDates : tour.dates;
  const selectedDate = availableDates.find((date) => date.id === selectedDateId);
  const parsedSlot = selectedDateId ? parsePartnerTourDateId(selectedDateId) : null;

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => createPartnerContactForm(guests, user));

  const previewSummary = useMemo(() => {
    const dateLabel =
      dateMode === "custom" && customDate
        ? new Intl.DateTimeFormat("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(customDate)
        : selectedDate
          ? formatDateRange(selectedDate.startDate, selectedDate.endDate)
          : "—";

    const priceLabel = partnerBookingPrice?.displayFallback
      ? partnerBookingPrice.displayFallback
      : partnerBookingPrice?.totalValue
        ? `${Math.round(partnerBookingPrice.totalValue).toLocaleString("ru-RU")} ${partnerBookingPrice.currency}`
        : tour.partnerPriceDisplay ?? "Уточняется на Tripster";

    return {
      dateLabel,
      guestsLabel: formatTourists(guests),
      priceLabel,
      perPersonLabel: partnerBookingPrice?.perPersonLabel,
      spotsLeft: selectedDate?.spotsLeft,
    };
  }, [
    customDate,
    dateMode,
    guests,
    partnerBookingPrice,
    selectedDate,
    tour.partnerPriceDisplay,
  ]);

  useEffect(() => {
    if (!user) return;
    const autofill = contactFieldsFromAuthUser(user);
    const fullName = [autofill.contactFirstName, autofill.contactLastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ");
    setForm((prev) => ({
      ...prev,
      contactFullName: fullName || prev.contactFullName,
      contactEmail: autofill.contactEmail || prev.contactEmail,
      contactPhone: autofill.contactPhone || prev.contactPhone,
    }));
  }, [user?.id, user?.phone, user?.country, user?.email, user?.fullName]);

  function handleClosePreview() {
    closePartnerBookingPreview();
    setError(null);
  }

  function handleEditDate() {
    setError(null);
    requestPartnerBookingEdit("date");
  }

  function handleEditGuests() {
    setError(null);
    requestPartnerBookingEdit("guests");
  }

  async function handleConfirmBooking() {
    const bookingTour = { ...tour, dates: availableDates };
    const dateError = validateBookingDates(
      bookingTour,
      dateMode,
      customDate,
      guests,
      selectedDateId
    );
    if (dateError) {
      setError(dateError);
      return;
    }

    const { firstName } = splitFullName(form.contactFullName);
    if (!firstName.trim()) {
      setError("Укажите имя и фамилию контактного лица.");
      return;
    }

    const contact = buildTripsterBookingContactPayload({
      name: form.contactFullName,
      email: form.contactEmail,
      phone: form.contactPhone,
      messageToGuide: form.comments,
      profileCountry: user?.country,
    });

    if ("error" in contact) {
      setError(contact.error);
      return;
    }

    const date =
      dateMode === "custom" && customDate
        ? customDate.toISOString().slice(0, 10)
        : parsedSlot?.startDate ?? selectedDate?.startDate;
    const time = parsedSlot?.time ?? "08:00";

    if (!date) {
      setError("Выберите дату заезда.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/tripster/booking-request", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: tour.slug,
          date,
          time,
          personsCount: guests,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          messageToGuide: contact.messageToGuide,
          productType: "tour",
          userId: user?.id,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        mode?: string;
        orderUrl?: string;
        fallbackUrl?: string;
        fallbackReason?: string;
        error?: string;
        details?: Record<string, string[] | { non_field_errors?: string[] }>;
      };

      if (data.mode === "affiliate_fallback" && data.fallbackUrl) {
        const description = resolveTripsterFallbackDescription(data.fallbackReason);
        feedback.loading({
          title: "Открываем Tripster",
          description,
        });
        openPartnerBookingUrl(data.fallbackUrl);
        return;
      }

      if (!response.ok || !data.ok) {
        const details = data.details;
        const firstFieldError =
          details &&
          Object.values(details)
            .flatMap((value) => (Array.isArray(value) ? value : value.non_field_errors ?? []))
            .find(Boolean);
        throw new Error(firstFieldError || data.error || "Не удалось отправить заявку");
      }

      setSubmitted(true);
      feedback.success({
        title: "Заявка отправлена",
        description: "Переходим к оформлению на Tripster…",
      });

      if (data.orderUrl) {
        openPartnerBookingUrl(data.orderUrl);
        return;
      }

      throw new Error("Tripster не вернул ссылку на заказ. Попробуйте ещё раз.");
    } catch (submitError) {
      const normalized = normalizeSiteError(submitError, {
        title: "Не удалось отправить заявку",
      });
      setError(normalized.description ?? normalized.title);
      feedback.showError(normalized);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm leading-relaxed text-charcoal">
        Заявка принята. Проверьте почту{" "}
        <span className="font-medium">{form.contactEmail}</span> и завершите бронирование на
        Tripster.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PartnerTourBookingPreviewCard
        dateLabel={previewSummary.dateLabel}
        guestsLabel={previewSummary.guestsLabel}
        spotsLeft={previewSummary.spotsLeft}
        priceLabel={previewSummary.priceLabel}
        perPersonLabel={previewSummary.perPersonLabel}
        onEditDate={handleEditDate}
        onEditGuests={handleEditGuests}
      />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-charcoal">Контактные данные</h3>
          <p className="mt-0.5 text-xs text-slate">Шаг 2 — заполните форму и подтвердите заявку</p>
        </div>
        <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-slate">
          2 / 2
        </span>
      </div>

      <BookingGuestLoginHint />

      <div>
        <label htmlFor="partner-contact-full-name" className="mb-1.5 block text-xs font-medium text-charcoal">
          Имя и фамилия
          <RequiredMark />
        </label>
        <Input
          id="partner-contact-full-name"
          placeholder="Иван Иванов"
          autoComplete="name"
          value={form.contactFullName}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, contactFullName: event.target.value }))
          }
        />
      </div>

      <div>
        <label htmlFor="partner-contact-email" className="mb-1.5 block text-xs font-medium text-charcoal">
          Email
          <RequiredMark />
        </label>
        <Input
          id="partner-contact-email"
          type="email"
          placeholder="email@example.com"
          value={form.contactEmail}
          onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="partner-contact-phone" className="mb-1.5 block text-xs font-medium text-charcoal">
          Телефон
          <RequiredMark />
        </label>
        <Input
          id="partner-contact-phone"
          type="tel"
          placeholder="+54 9 11 1234-5678"
          value={form.contactPhone}
          onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="partner-contact-comments" className="mb-1.5 block text-xs font-medium text-charcoal">
          Вопросы и пожелания
        </label>
        <Textarea
          id="partner-contact-comments"
          placeholder="Состав группы, особые даты, пожелания по программе…"
          value={form.comments}
          onChange={(event) => setForm((prev) => ({ ...prev, comments: event.target.value }))}
          rows={3}
        />
      </div>

      {error ? (
        <InlineFeedback variant="error" title="Проверьте форму" description={error} />
      ) : null}

      <div className="flex flex-col gap-2">
        <Button type="button" className="w-full gap-2" loading={submitting} onClick={handleConfirmBooking}>
          Подтвердить и забронировать
          <ExternalLink className="h-4 w-4" aria-hidden />
        </Button>
        {externalBookingHref ? (
          <p className="text-center text-xs leading-relaxed text-slate">
            Если автоматическая отправка не сработала, можно{" "}
            <a
              href={externalBookingHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky hover:underline"
            >
              открыть Tripster вручную
            </a>{" "}
            — дата и число туристов подставятся, контакты нужно будет ввести снова.
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={submitting}
          onClick={handleClosePreview}
        >
          Назад
        </Button>
      </div>
    </div>
  );
}
