"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardCheck, Clock3, ExternalLink, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { contactFieldsFromAuthUser } from "@/components/tour-detail/checkout/checkout-contact";
import { buildTripsterBookingContactPayload } from "@/lib/tripster/booking-contact";
import {
  openPartnerBookingUrl,
  resolveTripsterFallbackDescription,
} from "@/lib/tripster/open-partner-booking-url";
import { useExcursionBooking } from "@/components/excursions/ExcursionBookingContext";
import BookingGuestLoginHint from "@/components/booking/BookingGuestLoginHint";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { cn } from "@/lib/cn";
import { formatTourists } from "@/lib/pluralize";
import { normalizeSiteError } from "@/lib/site-feedback/normalize-error";
import type { AuthUser } from "@/types/auth";
import { trackBookingSubmit } from "@/lib/analytics/gtm-events";

function RequiredMark() {
  return (
    <span className="text-brand" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

function PreviewMetric({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-gray-100 bg-surface-muted/35 px-3 py-2.5", className)}>
      <div className="flex items-center gap-2 text-slate">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1.5 text-sm font-semibold leading-snug text-charcoal">{value}</p>
    </div>
  );
}

function ExcursionBookingPreviewCard({
  dateLabel,
  timeLabel,
  guestsLabel,
  priceLabel,
}: {
  dateLabel: string;
  timeLabel: string;
  guestsLabel: string;
  priceLabel: string;
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
            Проверьте дату, время, состав группы и сумму перед отправкой
          </p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start gap-3 rounded-xl border border-sky/15 bg-sky/[0.04] px-3.5 py-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sky shadow-sm">
            <CalendarDays className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-slate">Дата</p>
            <p className="mt-0.5 text-sm font-semibold leading-snug text-charcoal">{dateLabel}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <PreviewMetric icon={Clock3} label="Время" value={timeLabel} />
          <PreviewMetric icon={Users} label="Туристы" value={guestsLabel} />
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 border-t border-gray-100 bg-gray-50/70 px-4 py-3.5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate">Стоимость</p>
        <p className="text-right font-heading text-xl font-bold leading-none text-charcoal">{priceLabel}</p>
      </div>
    </section>
  );
}

function createExcursionContactForm(user?: AuthUser | null) {
  const autofill = user ? contactFieldsFromAuthUser(user) : null;
  return {
    name: autofill
      ? [autofill.contactFirstName, autofill.contactLastName]
          .map((part) => part.trim())
          .filter(Boolean)
          .join(" ")
      : "",
    email: autofill?.contactEmail ?? "",
    phone: autofill?.contactPhone ?? "",
    message: "",
  };
}

export default function ExcursionBookingContactSection() {
  const { t, locale } = useLocaleCurrency();
  const { user } = useAuth();
  const feedback = useSiteFeedback();
  const {
    excursion,
    selectedDate,
    selectedTime,
    selectedSlots,
    persons,
    quote,
    listedPriceLabel,
    closeBookingPreview,
  } = useExcursionBooking();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => createExcursionContactForm(user));

  const selectedSlot = selectedSlots.find((slot) => slot.time === selectedTime);

  const previewSummary = useMemo(() => {
    const dateLabel = selectedDate
      ? new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(`${selectedDate}T12:00:00`))
      : "—";

    const timeLabel = selectedTime
      ? `${selectedTime}${selectedSlot?.timeEnd ? `–${selectedSlot.timeEnd}` : ""}`
      : "—";

    const priceLabel =
      quote?.value_string?.trim() ||
      listedPriceLabel ||
      excursion.priceDisplay?.trim() ||
      "Уточняется у организатора";

    return {
      dateLabel,
      timeLabel,
      guestsLabel: formatTourists(persons),
      priceLabel,
    };
  }, [
    excursion.priceDisplay,
    listedPriceLabel,
    locale,
    persons,
    quote?.value_string,
    selectedDate,
    selectedSlot?.timeEnd,
    selectedTime,
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
      name: fullName || prev.name,
      email: autofill.contactEmail || prev.email,
      phone: autofill.contactPhone || prev.phone,
    }));
  }, [user?.id, user?.phone, user?.country, user?.email, user?.fullName]);

  function handleClosePreview() {
    closeBookingPreview();
    setError(null);
  }

  async function handleConfirmBooking() {
    if (!selectedDate || !selectedTime) {
      setError(t("excursions.booking.pickDateTime"));
      return;
    }

    if (!form.name.trim()) {
      setError(t("excursions.booking.name"));
      return;
    }

    const contact = buildTripsterBookingContactPayload({
      name: form.name,
      email: form.email,
      phone: form.phone,
      messageToGuide: form.message,
      profileCountry: user?.country,
    });

    if ("error" in contact) {
      setError(contact.error);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const endpoint =
        excursion.partner === "tripster"
          ? "/api/tripster/booking-request"
          : `/api/excursions/${excursion.slug}/book`;

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: excursion.slug,
          date: selectedDate,
          time: selectedTime,
          personsCount: persons,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          messageToGuide: contact.messageToGuide,
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
        throw new Error(firstFieldError || data.error || t("excursions.booking.failed"));
      }

      setSubmitted(true);
      trackBookingSubmit({
        productType: "excursion",
        slug: excursion.slug,
        title: excursion.title,
        partner: excursion.partner,
        guests: persons,
        source: "excursion_booking",
      });
      feedback.success({
        title: "Заявка отправлена",
        description: "Переходим к оформлению…",
      });

      if (data.orderUrl) {
        openPartnerBookingUrl(data.orderUrl);
        return;
      }

      throw new Error(t("excursions.booking.failed"));
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
        <span className="font-medium">{form.email}</span> и завершите бронирование на сайте
        партнёра.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ExcursionBookingPreviewCard
        dateLabel={previewSummary.dateLabel}
        timeLabel={previewSummary.timeLabel}
        guestsLabel={previewSummary.guestsLabel}
        priceLabel={previewSummary.priceLabel}
      />

      <BookingGuestLoginHint />

      <div className="space-y-3">
        <div>
          <label htmlFor="excursion-contact-name" className="mb-1.5 block text-xs font-medium text-charcoal">
            {t("excursions.booking.name")}
            <RequiredMark />
          </label>
          <Input
            id="excursion-contact-name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="excursion-contact-email" className="mb-1.5 block text-xs font-medium text-charcoal">
            {t("excursions.booking.email")}
            <RequiredMark />
          </label>
          <Input
            id="excursion-contact-email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="excursion-contact-phone" className="mb-1.5 block text-xs font-medium text-charcoal">
            {t("excursions.booking.phone")}
            <RequiredMark />
          </label>
          <Input
            id="excursion-contact-phone"
            type="tel"
            placeholder="+7 999 123 45 67"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            autoComplete="tel"
          />
        </div>

        <div>
          <label htmlFor="excursion-contact-message" className="mb-1.5 block text-xs font-medium text-charcoal">
            {t("excursions.booking.message")}
          </label>
          <Textarea
            id="excursion-contact-message"
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            rows={3}
          />
        </div>
      </div>

      {error ? <InlineFeedback variant="error" title="Проверьте форму" description={error} /> : null}

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          className="w-full gap-2"
          loading={submitting}
          loadingLabel={t("excursions.booking.submitting")}
          onClick={() => void handleConfirmBooking()}
        >
          Подтвердить и забронировать
          <ExternalLink className="h-4 w-4" aria-hidden />
        </Button>
        {excursion.bookingHref ? (
          <p className="text-center text-xs leading-relaxed text-slate">
            Если автоматическая отправка не сработала, можно{" "}
            <a
              href={excursion.bookingHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky hover:underline"
            >
              открыть сайт партнёра вручную
            </a>
            .
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
