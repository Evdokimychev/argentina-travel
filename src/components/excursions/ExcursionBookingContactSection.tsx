"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { contactFieldsFromAuthUser } from "@/components/tour-detail/checkout/checkout-contact";
import { buildTripsterBookingContactPayload } from "@/lib/tripster/booking-contact";
import {
  normalizePartnerBookingUrl,
  openPartnerBookingUrl,
  PARTNER_EXCURSION_BOOKING_THANK_YOU,
  resolveTripsterFallbackDescription,
} from "@/lib/tripster/open-partner-booking-url";
import {
  buildTripsterPartnerOpenUrl,
  resolveTripsterBookingRedirectFromApi,
} from "@/lib/tripster/checkout-url";
import { useExcursionBooking } from "@/components/excursions/ExcursionBookingContext";
import { ENABLE_PARTNER_CONTACT_FORM } from "@/lib/booking/partner-contact-form-flag";
import BookingGuestLoginHint from "@/components/booking/BookingGuestLoginHint";
import PartnerBookingSuccessPanel from "@/components/booking/PartnerBookingSuccessPanel";
import BookingPreviewCard, {
  excursionPreviewFields,
  formatExcursionBookingPreviewTimeLabel,
} from "@/components/booking/BookingPreviewCard";
import { formatExcursionBookingPreviewDateLabel } from "@/lib/excursion-date-label";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { formatTourists } from "@/lib/pluralize";
import {
  resolveExcursionBookingPreviewPrepaymentHint,
  resolveExcursionBookingPreviewPrice,
} from "@/lib/excursion-price-display";
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
  const [partnerBookingUrl, setPartnerBookingUrl] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => createExcursionContactForm(user));

  const selectedSlot = selectedSlots.find((slot) => slot.time === selectedTime);

  const prefilledPartnerOpenUrl = useMemo(() => {
    if (!selectedDate || !selectedTime) {
      const bare = excursion.tripsterUrl ?? excursion.bookingHref;
      return bare ? normalizePartnerBookingUrl(bare) : null;
    }

    if (excursion.partner !== "tripster") {
      return excursion.bookingHref ? normalizePartnerBookingUrl(excursion.bookingHref) : null;
    }

    const contact = ENABLE_PARTNER_CONTACT_FORM
      ? buildTripsterBookingContactPayload({
          name: form.name,
          email: form.email,
          phone: form.phone,
          messageToGuide: form.message,
          profileCountry: user?.country,
        })
      : null;
    const contactParams = contact && !("error" in contact) ? contact : null;

    return normalizePartnerBookingUrl(
      buildTripsterPartnerOpenUrl(excursion.id, {
        startDate: selectedDate,
        time: selectedTime,
        guests: persons,
        name: contactParams?.name,
        email: contactParams?.email,
        phone: contactParams?.phone,
        messageToGuide: contactParams?.messageToGuide,
        fallbackUrl: excursion.tripsterUrl,
      })
    );
  }, [
    excursion.bookingHref,
    excursion.id,
    excursion.partner,
    excursion.tripsterUrl,
    form.email,
    form.message,
    form.name,
    form.phone,
    persons,
    selectedDate,
    selectedTime,
    user?.country,
  ]);

  const previewSummary = useMemo(() => {
    const dateLabel = selectedDate
      ? formatExcursionBookingPreviewDateLabel(selectedDate, locale)
      : "—";

    const timeLabel = formatExcursionBookingPreviewTimeLabel({
      startTime: selectedTime,
      timeEnd: selectedSlot?.timeEnd,
      durationMinutes: excursion.durationMinutes,
      t,
    });

    const priceLabel = resolveExcursionBookingPreviewPrice({
      quote,
      listedPriceLabel,
      priceDisplay: excursion.priceDisplay,
      fallback: "Уточняется у организатора",
    });

    const prepaymentHint = resolveExcursionBookingPreviewPrepaymentHint(quote, t);

    return {
      dateLabel,
      timeLabel,
      guestsLabel: formatTourists(persons),
      priceLabel,
      prepaymentHint,
    };
  }, [
    excursion.durationMinutes,
    excursion.priceDisplay,
    listedPriceLabel,
    locale,
    persons,
    quote,
    selectedDate,
    selectedSlot?.timeEnd,
    selectedTime,
    t,
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
    setPartnerBookingUrl(null);
    setPopupBlocked(false);
  }

  function completePartnerBookingTransition(
    openUrl: string,
    fallbackReason?: string | null
  ) {
    const normalized = normalizePartnerBookingUrl(openUrl);
    setSubmitted(true);
    setPartnerBookingUrl(normalized);
    setPopupBlocked(!openPartnerBookingUrl(normalized));
    trackBookingSubmit({
      productType: "excursion",
      slug: excursion.slug,
      title: excursion.title,
      partner: excursion.partner,
      guests: persons,
      source: "excursion_affiliate_fallback",
    });
    feedback.success({
      title: "Заявка принята",
      description: resolveTripsterFallbackDescription(fallbackReason),
    });
  }

  function buildTripsterCheckoutContext(
    contact: { name: string; email: string; phone: string; messageToGuide?: string }
  ) {
    return {
      startDate: selectedDate!,
      time: selectedTime!,
      guests: persons,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      messageToGuide: contact.messageToGuide,
      fallbackUrl: excursion.tripsterUrl,
    };
  }

  async function handleConfirmBooking() {
    if (!selectedDate || !selectedTime) {
      setError(t("excursions.booking.pickDateTime"));
      return;
    }

    if (ENABLE_PARTNER_CONTACT_FORM && !form.name.trim()) {
      setError(t("excursions.booking.name"));
      return;
    }

    const contact = ENABLE_PARTNER_CONTACT_FORM
      ? buildTripsterBookingContactPayload({
          name: form.name,
          email: form.email,
          phone: form.phone,
          messageToGuide: form.message,
          profileCountry: user?.country,
        })
      : { name: "", email: "", phone: "", messageToGuide: undefined as string | undefined };

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
        orderId?: number;
        orderUrl?: string;
        fallbackUrl?: string;
        fallbackReason?: string;
        error?: string;
        details?: Record<string, string[] | { non_field_errors?: string[] }>;
      };

      if (data.mode === "affiliate_fallback") {
        completePartnerBookingTransition(
          resolveTripsterBookingRedirectFromApi({
            response: data,
            experienceId: excursion.id,
            context: buildTripsterCheckoutContext(contact),
          }),
          data.fallbackReason
        );
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

      const checkoutUrl = normalizePartnerBookingUrl(
        resolveTripsterBookingRedirectFromApi({
          response: data,
          experienceId: excursion.id,
          context: buildTripsterCheckoutContext(contact),
        })
      );
      setPartnerBookingUrl(checkoutUrl);
      setPopupBlocked(!openPartnerBookingUrl(checkoutUrl));
      feedback.success({
        title: "Заявка принята",
        description: PARTNER_EXCURSION_BOOKING_THANK_YOU,
      });
      return;
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
    const partnerLabel = excursion.partner === "sputnik8" ? "Sputnik8" : "Tripster";

    return (
      <PartnerBookingSuccessPanel
        message={PARTNER_EXCURSION_BOOKING_THANK_YOU}
        partnerLabel={partnerLabel}
        partnerBookingUrl={partnerBookingUrl}
        popupBlocked={popupBlocked}
        productType="excursion"
        onClose={closeBookingPreview}
      />
    );
  }

  return (
    <div className="space-y-5">
      <BookingPreviewCard
        productTitle={excursion.title}
        imageUrl={excursion.coverImage}
        description="Проверьте дату, время, состав группы и сумму перед отправкой"
        fields={excursionPreviewFields({
          dateLabel: previewSummary.dateLabel,
          timeLabel: previewSummary.timeLabel,
          guestsLabel: previewSummary.guestsLabel,
        })}
        priceLabel={previewSummary.priceLabel}
        priceHint={previewSummary.prepaymentHint}
      />

      <BookingGuestLoginHint />

      {/*
        Контактные поля (имя, email, телефон, сообщение гиду) заархивированы:
        для анонимных пользователей контакты не передаются Tripster, поэтому
        форма убрана. Бронирование передаёт дату, время и число туристов.
        Восстановление: ENABLE_PARTNER_CONTACT_FORM = true
        (@/lib/booking/partner-contact-form-flag).
      */}
      {ENABLE_PARTNER_CONTACT_FORM ? (
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
      ) : null}

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
        {prefilledPartnerOpenUrl ? (
          <p className="text-center text-xs leading-relaxed text-slate">
            Если автоматическая отправка не сработала, можно{" "}
            <a
              href={prefilledPartnerOpenUrl}
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
