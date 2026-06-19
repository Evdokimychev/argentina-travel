"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { createBookingFromCheckout } from "@/lib/bookings-store";
import { getStoredFirstTouchAttribution } from "@/lib/attribution/first-touch";
import { contactFieldsFromAuthUser, splitFullName } from "@/components/tour-detail/checkout/checkout-contact";
import { createInitialCheckoutForm } from "@/components/tour-detail/checkout/types";
import { validateBookingDates } from "@/components/tour-detail/BookingDateSelector";
import { useTourBooking } from "@/components/tour-detail/TourBookingContext";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { normalizeSiteError } from "@/lib/site-feedback/normalize-error";
import type { TourDetail } from "@/types";

function RequiredMark() {
  return (
    <span className="text-brand" aria-hidden="true">
      {" "}
      *
    </span>
  );
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
  } = useTourBooking();

  const selectedDate = tour.dates.find((date) => date.id === selectedDateId);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => {
    const base = createInitialCheckoutForm(guests);
    const fullName = [base.contactFirstName, base.contactLastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ");
    return {
      contactFullName: fullName,
      contactEmail: base.contactEmail,
      contactPhone: base.contactPhone,
      comments: "",
    };
  });

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
  }, [user]);

  async function handleSubmit() {
    const dateError = validateBookingDates(tour, dateMode, customDate, guests, selectedDateId);
    if (dateError) {
      setError(dateError);
      return;
    }

    const { firstName, lastName } = splitFullName(form.contactFullName);
    if (!firstName.trim()) {
      setError("Укажите имя и фамилию контактного лица.");
      return;
    }

    if (!form.contactEmail.trim() || !form.contactEmail.includes("@")) {
      setError("Укажите корректный email — на него придёт подтверждение.");
      return;
    }

    if (!form.contactPhone.trim()) {
      setError("Укажите телефон для связи.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const startDate =
      dateMode === "custom" && customDate
        ? customDate.toISOString().slice(0, 10)
        : selectedDate?.startDate;
    const endDate =
      dateMode === "custom" && customDate
        ? new Date(customDate.getTime() + (tour.durationDays - 1) * 86400000)
            .toISOString()
            .slice(0, 10)
        : selectedDate?.endDate;

    const partnerNote = partnerBookingPrice?.displayFallback
      ? `Ориентир Tripster: ${partnerBookingPrice.displayFallback}`
      : partnerBookingPrice?.totalValue
        ? `Ориентир Tripster: ${partnerBookingPrice.totalValue} ${partnerBookingPrice.currency}`
        : "";

    const comments = [form.comments.trim(), partnerNote, "Партнёрский тур Tripster — заявка с сайта."]
      .filter(Boolean)
      .join("\n\n");

    const checkoutForm = createInitialCheckoutForm(guests);
    const totalPriceUsd =
      partnerBookingPrice?.currency === "USD" && partnerBookingPrice.totalValue > 0
        ? partnerBookingPrice.totalValue
        : tour.priceUsd > 0
          ? tour.priceUsd * guests
          : 0;

    const result = await createBookingFromCheckout({
      actor: user,
      userId: user?.id,
      tour,
      guests,
      startDate,
      endDate,
      totalPriceUsd,
      form: {
        ...checkoutForm,
        contactFirstName: firstName,
        contactLastName: lastName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        comments,
        paymentOption: "later",
        fillTravelersLater: true,
      },
      attribution: getStoredFirstTouchAttribution() ?? undefined,
    });

    if ("error" in result) {
      const normalized = normalizeSiteError(result.error, {
        title: "Не удалось отправить заявку",
      });
      setError(normalized.description ?? normalized.title);
      feedback.showError(normalized);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
    feedback.success({
      title: "Заявка отправлена",
      description:
        "Мы сохранили ваши данные. Для оплаты и подтверждения перейдите на Tripster — кнопка ниже.",
      action: user ? { label: "Мои заявки", href: "/profile/bookings" } : undefined,
    });
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm leading-relaxed text-charcoal">
        Заявка принята. Проверьте почту{" "}
        <span className="font-medium">{form.contactEmail}</span> и оформите бронирование на Tripster.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-charcoal">Контактные данные</h3>
        <p className="mt-0.5 text-xs text-slate">
          Как на Tripster — одно поле для имени, затем можно перейти к бронированию
        </p>
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

      {error ? (
        <InlineFeedback variant="error" title="Проверьте форму" description={error} />
      ) : null}

      <Button type="button" className="w-full" loading={submitting} onClick={handleSubmit}>
        Отправить заявку
      </Button>
    </div>
  );
}
