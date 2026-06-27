"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
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
import { ENABLE_PARTNER_CONTACT_FORM } from "@/lib/booking/partner-contact-form-flag";
import BookingGuestLoginHint from "@/components/booking/BookingGuestLoginHint";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { normalizeSiteError } from "@/lib/site-feedback/normalize-error";
import { formatDateRange } from "@/lib/utils";
import { formatTourists } from "@/lib/pluralize";
import { parsePartnerTourDateId } from "@/lib/tripster/partner-tour-price";
import { buildTripsterBookingContactPayload } from "@/lib/tripster/booking-contact";
import { buildPartnerTourAffiliateFallbackPath } from "@/lib/partner-tour/affiliate-fallback";
import {
  normalizePartnerBookingUrl,
  openPartnerBookingUrl,
  PARTNER_TOUR_BOOKING_THANK_YOU,
  resolveTripsterFallbackDescription,
  resolveYouTravelFallbackDescription,
} from "@/lib/tripster/open-partner-booking-url";
import { resolveTripsterBookingRedirectFromApi, buildTripsterPartnerOpenUrl } from "@/lib/tripster/checkout-url";
import PartnerBookingSuccessPanel from "@/components/booking/PartnerBookingSuccessPanel";
import BookingPreviewCard, { partnerTourPreviewFields } from "@/components/booking/BookingPreviewCard";
import {
  isYouTravelPartnerDetail,
  parseYouTravelOfferDateId,
} from "@/lib/youtravel/partner-tour-utils";
import { resolveYouTravelBookingRedirectFromApi } from "@/lib/youtravel/checkout-url";
import type { TourDetail } from "@/types";
import { trackBookingSubmit } from "@/lib/analytics/gtm-events";

function RequiredMark() {
  return (
    <span className="text-brand" aria-hidden="true">
      {" "}
      *
    </span>
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
  const isYouTravel = isYouTravelPartnerDetail(tour);
  const partnerLabel = isYouTravel ? "YouTravel.me" : "Tripster";
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
  const [partnerBookingUrl, setPartnerBookingUrl] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
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
        : tour.partnerPriceDisplay ?? (isYouTravel ? "Уточняется на YouTravel.me" : "Уточняется на Tripster");

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

  const prefilledBookingHref = useMemo(() => {
    const startDate =
      dateMode === "custom" && customDate
        ? customDate.toISOString().slice(0, 10)
        : parsedSlot?.startDate ?? selectedDate?.startDate;
    if (!startDate) return externalBookingHref;

    const contact = ENABLE_PARTNER_CONTACT_FORM
      ? buildTripsterBookingContactPayload({
          name: form.contactFullName,
          email: form.contactEmail,
          phone: form.contactPhone,
          messageToGuide: form.comments,
          profileCountry: user?.country,
        })
      : null;
    if (contact && "error" in contact) return externalBookingHref;
    const contactParams = contact && !("error" in contact) ? contact : null;

    if (!isYouTravel) {
      return normalizePartnerBookingUrl(
        buildTripsterPartnerOpenUrl(tour.partnerExperienceId ?? 0, {
          startDate,
          time: parsedSlot?.time ?? "08:00",
          guests,
          name: contactParams?.name,
          email: contactParams?.email,
          phone: contactParams?.phone,
          messageToGuide: contactParams?.messageToGuide,
          fallbackUrl: externalBookingHref,
        })
      );
    }

    return buildPartnerTourAffiliateFallbackPath({
      slug: tour.slug,
      partner: isYouTravel ? "youtravel" : "tripster",
      startDate,
      endDate: selectedDate?.endDate,
      guests,
      name: contactParams?.name,
      email: contactParams?.email,
      phone: contactParams?.phone,
      offerId: selectedDateId ? parseYouTravelOfferDateId(selectedDateId)?.offerId : undefined,
      time: isYouTravel ? undefined : parsedSlot?.time ?? "08:00",
    });
  }, [
    customDate,
    dateMode,
    externalBookingHref,
    form.comments,
    form.contactEmail,
    form.contactFullName,
    form.contactPhone,
    guests,
    isYouTravel,
    parsedSlot?.startDate,
    parsedSlot?.time,
    selectedDate?.endDate,
    selectedDate?.startDate,
    selectedDateId,
    tour.slug,
    tour.partnerExperienceId,
    user?.country,
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
    setPartnerBookingUrl(null);
    setPopupBlocked(false);
  }

  function buildTripsterCheckoutContext(
    contact: { name: string; email: string; phone: string; messageToGuide?: string },
    startDate: string,
    slotTime?: string
  ) {
    return {
      startDate,
      time: slotTime,
      guests,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      messageToGuide: contact.messageToGuide,
      fallbackUrl: externalBookingHref,
    };
  }

  function resolveTripsterRedirectUrl(
    data: {
      ok?: boolean;
      mode?: string;
      orderId?: number;
      orderUrl?: string;
      fallbackUrl?: string;
      fallbackReason?: string;
    },
    contact: { name: string; email: string; phone: string; messageToGuide?: string },
    startDate: string,
    slotTime?: string
  ): string {
    return normalizePartnerBookingUrl(
      resolveTripsterBookingRedirectFromApi({
        response: data,
        experienceId: tour.partnerExperienceId ?? 0,
        context: buildTripsterCheckoutContext(contact, startDate, slotTime),
      })
    );
  }

  function completePartnerBookingTransition(openUrl: string, reason?: string | null) {
    const normalized = normalizePartnerBookingUrl(openUrl);
    setSubmitted(true);
    setPartnerBookingUrl(normalized);
    setPopupBlocked(!openPartnerBookingUrl(normalized));
    trackBookingSubmit({
      productType: "tour",
      slug: tour.slug,
      title: tour.title,
      partner: isYouTravel ? "youtravel" : "tripster",
      guests,
      source: "partner_affiliate_fallback",
    });
    feedback.success({
      title: "Заявка принята",
      description: isYouTravel
        ? resolveYouTravelFallbackDescription(reason)
        : resolveTripsterFallbackDescription(reason),
    });
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

    if (ENABLE_PARTNER_CONTACT_FORM) {
      const { firstName } = splitFullName(form.contactFullName);
      if (!firstName.trim()) {
        setError("Укажите имя и фамилию контактного лица.");
        return;
      }
    }

    const contact = ENABLE_PARTNER_CONTACT_FORM
      ? buildTripsterBookingContactPayload({
          name: form.contactFullName,
          email: form.contactEmail,
          phone: form.contactPhone,
          messageToGuide: form.comments,
          profileCountry: user?.country,
        })
      : { name: "", email: "", phone: "", messageToGuide: undefined as string | undefined };

    if ("error" in contact) {
      setError(contact.error);
      return;
    }

    const date =
      dateMode === "custom" && customDate
        ? customDate.toISOString().slice(0, 10)
        : parsedSlot?.startDate ?? selectedDate?.startDate;
    const endDate = selectedDate?.endDate ?? undefined;
    const time = isYouTravel ? undefined : parsedSlot?.time ?? "08:00";
    const offerId = selectedDateId
      ? parseYouTravelOfferDateId(selectedDateId)?.offerId
      : undefined;

    if (!date) {
      setError("Выберите дату заезда.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setPartnerBookingUrl(null);
    setPopupBlocked(false);

    const clientFallbackUrl = buildPartnerTourAffiliateFallbackPath({
      slug: tour.slug,
      partner: isYouTravel ? "youtravel" : "tripster",
      startDate: date,
      endDate,
      guests,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      offerId,
      time,
    });

    try {
      const bookingEndpoint = isYouTravel
        ? "/api/youtravel/booking-request"
        : "/api/tripster/booking-request";

      const bookingBody = isYouTravel
        ? {
            slug: tour.slug,
            startDate: date,
            endDate,
            offerId,
            personsCount: guests,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            message: contact.messageToGuide,
            userId: user?.id,
          }
        : {
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
          };

      const response = await fetch(bookingEndpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingBody),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        mode?: string;
        orderId?: number | string;
        orderUrl?: string;
        fallbackUrl?: string;
        fallbackReason?: string;
        error?: string;
        details?: Record<string, string[] | { non_field_errors?: string[] }>;
      };

      if (data.mode === "affiliate_fallback") {
        completePartnerBookingTransition(
          isYouTravel
            ? (data.fallbackUrl ?? clientFallbackUrl)
            : resolveTripsterRedirectUrl(data, contact, date, time),
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

        if (firstFieldError) {
          throw new Error(firstFieldError);
        }

        completePartnerBookingTransition(
          isYouTravel
            ? (data.fallbackUrl ?? clientFallbackUrl)
            : resolveTripsterRedirectUrl(data, contact, date, time),
          data.fallbackReason ?? "partner_site_fallback"
        );
        return;
      }

      setSubmitted(true);
      trackBookingSubmit({
        productType: "tour",
        slug: tour.slug,
        title: tour.title,
        partner: isYouTravel ? "youtravel" : "tripster",
        guests,
        source: "partner_booking",
      });

      const checkoutUrl = isYouTravel
        ? resolveYouTravelBookingRedirectFromApi({
            response: data,
            tourId: tour.partnerExperienceId ?? 0,
            fallbackUrl: clientFallbackUrl,
          })
        : resolveTripsterRedirectUrl(data, contact, date, time);
      setPartnerBookingUrl(normalizePartnerBookingUrl(checkoutUrl));
      setPopupBlocked(!openPartnerBookingUrl(checkoutUrl));
      feedback.success({
        title: "Заявка принята",
        description: PARTNER_TOUR_BOOKING_THANK_YOU,
      });
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
      <PartnerBookingSuccessPanel
        message={PARTNER_TOUR_BOOKING_THANK_YOU}
        partnerLabel={partnerLabel}
        partnerBookingUrl={partnerBookingUrl}
        popupBlocked={popupBlocked}
        productType="tour"
        onClose={closePartnerBookingPreview}
      />
    );
  }

  return (
    <div className="space-y-4">
      <BookingPreviewCard
        productTitle={tour.title}
        imageUrl={tour.image}
        description="Проверьте дату, состав группы и сумму перед отправкой"
        fields={partnerTourPreviewFields({
          dateLabel: previewSummary.dateLabel,
          guestsLabel: previewSummary.guestsLabel,
          spotsLeft: previewSummary.spotsLeft,
          onEditDate: handleEditDate,
          onEditGuests: handleEditGuests,
        })}
        priceLabel={previewSummary.priceLabel}
        priceHint={previewSummary.perPersonLabel}
      />

      <BookingGuestLoginHint />

      {/*
        Контактные поля (имя и фамилия, email, телефон, вопросы и пожелания)
        заархивированы: для анонимных пользователей контакты не передаются
        партнёру (Tripster / YouTravel), поэтому форма убрана. Бронирование
        передаёт дату, состав группы (и время для Tripster).
        Восстановление: ENABLE_PARTNER_CONTACT_FORM = true
        (@/lib/booking/partner-contact-form-flag).
      */}
      {ENABLE_PARTNER_CONTACT_FORM ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-charcoal">Контактные данные</h3>
              <p className="mt-0.5 text-xs text-slate">Шаг 2 — заполните форму и подтвердите заявку</p>
            </div>
            <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-slate">
              2 / 2
            </span>
          </div>

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
        </>
      ) : null}

      {error ? (
        <InlineFeedback variant="error" title="Проверьте форму" description={error} />
      ) : null}

      <div className="flex flex-col gap-2">
        <Button type="button" className="w-full gap-2" loading={submitting} onClick={handleConfirmBooking}>
          Подтвердить и забронировать
          <ExternalLink className="h-4 w-4" aria-hidden />
        </Button>
        {prefilledBookingHref ? (
          <p className="text-center text-xs leading-relaxed text-slate">
            Если не удалось открыть страницу оформления автоматически, можно{" "}
            <a
              href={prefilledBookingHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky hover:underline"
            >
              открыть {partnerLabel} вручную
            </a>{" "}
            — дата и состав группы подставятся автоматически, контактные данные заполните на сайте партнёра.
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
