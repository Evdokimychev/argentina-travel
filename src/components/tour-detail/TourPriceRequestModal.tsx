"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { TourDetail } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { createBookingFromCheckout } from "@/lib/bookings-store";
import { formatTouristsBooking } from "@/lib/pluralize";
import { formatDateRange } from "@/lib/utils";
import { normalizeSiteError } from "@/lib/site-feedback/normalize-error";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import BookingDateSelector, { validateBookingDates } from "./BookingDateSelector";
import GuestCounter from "./GuestCounter";
import { useTourBooking } from "./TourBookingContext";
import { getGuestLimits } from "@/lib/tour-booking-spots";
import { contactFieldsFromAuthUser } from "./checkout/checkout-contact";
import { createInitialCheckoutForm } from "./checkout/types";
import { TOUR_PRICE_ON_REQUEST_HINT } from "@/lib/tour-price-public";

interface TourPriceRequestModalProps {
  tour: TourDetail;
}

export default function TourPriceRequestModal({ tour }: TourPriceRequestModalProps) {
  const { user } = useAuth();
  const feedback = useSiteFeedback();
  const {
    priceRequestOpen,
    closePriceRequest,
    guests,
    setGuests,
    dateMode,
    customDate,
    selectedDateId,
  } = useTourBooking();

  const selectedDate = tour.dates.find((d) => d.id === selectedDateId);
  const guestLimits = getGuestLimits(tour, selectedDate, dateMode);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => {
    const base = createInitialCheckoutForm(guests);
    return {
      contactFirstName: base.contactFirstName,
      contactLastName: base.contactLastName,
      contactEmail: base.contactEmail,
      contactPhone: base.contactPhone,
      comments: "",
    };
  });

  useEffect(() => {
    if (!user || !priceRequestOpen) return;
    const autofill = contactFieldsFromAuthUser(user);
    setForm((prev) => ({
      ...prev,
      contactFirstName: autofill.contactFirstName || prev.contactFirstName,
      contactLastName: autofill.contactLastName || prev.contactLastName,
      contactEmail: autofill.contactEmail || prev.contactEmail,
      contactPhone: autofill.contactPhone || prev.contactPhone,
    }));
  }, [user, priceRequestOpen]);

  useEffect(() => {
    if (!priceRequestOpen) {
      setSubmitted(false);
      setError(null);
    }
  }, [priceRequestOpen]);

  async function handleSubmit() {
    const dateError = validateBookingDates(tour, dateMode, customDate, guests, selectedDateId);
    if (dateError) {
      setError(dateError);
      return;
    }

    if (!form.contactEmail.trim()) {
      setError("Укажите email — на него пришлём расчёт стоимости.");
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

    const checkoutForm = createInitialCheckoutForm(guests);
    const result = await createBookingFromCheckout({
      actor: user,
      userId: user?.id,
      tour,
      guests,
      startDate,
      endDate,
      totalPriceUsd: 0,
      form: {
        ...checkoutForm,
        contactFirstName: form.contactFirstName,
        contactLastName: form.contactLastName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        comments: form.comments,
        paymentOption: "later",
        fillTravelersLater: true,
      },
      priceQuoteRequest: true,
    });

    if ("error" in result) {
      const normalized = normalizeSiteError(result.error, {
        title: "Не удалось отправить запрос",
      });
      setError(normalized.description ?? normalized.title);
      feedback.showError(normalized);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
    feedback.success({
      title: "Запрос отправлен",
      description: "Организатор подготовит персональный расчёт и свяжется с вами по email.",
      action: user ? { label: "Мои заявки", href: "/profile/bookings" } : undefined,
    });
  }

  return (
    <Dialog open={priceRequestOpen} onOpenChange={(open) => !open && closePriceRequest()}>
      <DialogContent bottomSheet className="max-w-lg p-0">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-violet-800">
                Цена по запросу
              </p>
              <h2 className="font-heading text-xl font-bold text-charcoal">Запросить расчёт</h2>
              <p className="mt-1 text-sm text-slate">{TOUR_PRICE_ON_REQUEST_HINT}</p>
            </div>
            <button
              type="button"
              onClick={closePriceRequest}
              className="rounded-lg p-1 text-slate hover:bg-gray-100"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          {submitted ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-4 text-sm text-charcoal">
              Заявка принята. Организатор уточнит детали и пришлёт персональное предложение на{" "}
              <span className="font-medium">{form.contactEmail}</span>.
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-charcoal">
                <p className="font-medium">{tour.title}</p>
                <p className="mt-1 text-slate">
                  {formatTouristsBooking(guests)}
                  {selectedDate
                    ? ` · ${formatDateRange(selectedDate.startDate, selectedDate.endDate)}`
                    : customDate
                      ? ` · ${customDate.toLocaleDateString("ru-RU")}`
                      : ""}
                </p>
              </div>

              <BookingDateSelector tour={tour} idPrefix="price-request" />
              <GuestCounter
                value={guests}
                min={guestLimits.min}
                max={Math.max(guestLimits.min, guestLimits.max)}
                minimumAge={tour.minimumAge}
                onChange={setGuests}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="Имя"
                  value={form.contactFirstName}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, contactFirstName: event.target.value }))
                  }
                />
                <Input
                  placeholder="Фамилия"
                  value={form.contactLastName}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, contactLastName: event.target.value }))
                  }
                />
              </div>
              <Input
                type="email"
                placeholder="Email *"
                value={form.contactEmail}
                onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
              />
              <Input
                placeholder="Телефон"
                value={form.contactPhone}
                onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
              />
              <Textarea
                placeholder="Пожелания: состав группы, уровень комфорта, особые даты…"
                value={form.comments}
                onChange={(event) => setForm((prev) => ({ ...prev, comments: event.target.value }))}
                rows={4}
              />

              {error ? (
                <InlineFeedback variant="error" title="Проверьте форму" description={error} />
              ) : null}

              <Button type="button" className="w-full" loading={submitting} onClick={handleSubmit}>
                Отправить запрос
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
