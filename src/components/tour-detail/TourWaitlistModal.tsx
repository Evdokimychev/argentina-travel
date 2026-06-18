"use client";

import { useEffect, useState } from "react";
import { X, ListOrdered } from "lucide-react";
import { TourDetail } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { createWaitlistFromForm } from "@/lib/waitlist-store";
import { formatTourists } from "@/lib/pluralize";
import { formatDateRange } from "@/lib/utils";
import { normalizeSiteError } from "@/lib/site-feedback/normalize-error";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import GuestCounter from "./GuestCounter";
import { useTourBooking } from "./TourBookingContext";
import { getGuestLimits } from "@/lib/tour-booking-spots";
import { contactFieldsFromAuthUser } from "./checkout/checkout-contact";
import { createInitialCheckoutForm } from "./checkout/types";
import { WAITLIST_HINT } from "@/lib/tour-waitlist";
import { tourDetailInsetMutedClass, tourDetailPromoHeadingClass } from "@/lib/tour-detail-ui";
import { cn } from "@/lib/cn";

interface TourWaitlistModalProps {
  tour: TourDetail;
}

export default function TourWaitlistModal({ tour }: TourWaitlistModalProps) {
  const { user } = useAuth();
  const feedback = useSiteFeedback();
  const {
    waitlistOpen,
    closeWaitlist,
    guests,
    setGuests,
    dateMode,
    selectedDateId,
    waitlistScenario,
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
    if (!user || !waitlistOpen) return;
    const autofill = contactFieldsFromAuthUser(user);
    setForm((prev) => ({
      ...prev,
      contactFirstName: autofill.contactFirstName || prev.contactFirstName,
      contactLastName: autofill.contactLastName || prev.contactLastName,
      contactEmail: autofill.contactEmail || prev.contactEmail,
      contactPhone: autofill.contactPhone || prev.contactPhone,
    }));
  }, [user, waitlistOpen]);

  useEffect(() => {
    if (!waitlistOpen) {
      setSubmitted(false);
      setError(null);
    }
  }, [waitlistOpen]);

  async function handleSubmit() {
    if (!form.contactEmail.trim()) {
      setError("Укажите email — мы сообщим, когда появится место.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = createWaitlistFromForm({
      actor: user,
      userId: user?.id,
      tour,
      guests,
      tourDateId: selectedDate?.id,
      startDate: selectedDate?.startDate,
      endDate: selectedDate?.endDate,
      form: {
        ...createInitialCheckoutForm(guests),
        contactFirstName: form.contactFirstName,
        contactLastName: form.contactLastName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        comments: form.comments,
      },
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
      title: "Вы в листе ожидания",
      description: "Организатор свяжется с вами, если место освободится или наберётся группа.",
      action: user ? { label: "Мои заявки", href: "/profile/bookings?tab=waitlist" } : undefined,
    });
  }

  return (
    <Dialog open={waitlistOpen} onOpenChange={(open) => !open && closeWaitlist()}>
      <DialogContent bottomSheet className="max-w-lg p-0">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={tourDetailPromoHeadingClass}>
                Лист ожидания
              </p>
              <h2 className="font-heading text-xl font-bold text-charcoal">
                Записаться в очередь
              </h2>
              <p className="mt-1 text-sm text-slate">{WAITLIST_HINT}</p>
            </div>
            <button
              type="button"
              onClick={closeWaitlist}
              className="rounded-lg p-1 text-slate hover:bg-gray-100"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          {submitted ? (
            <div className={cn(tourDetailInsetMutedClass, "px-4 py-4 text-sm text-charcoal")}>
              Заявка принята. Мы сообщим на{" "}
              <span className="font-medium">{form.contactEmail}</span>, когда организатор сможет
              предложить место.
            </div>
          ) : (
            <>
              {waitlistScenario.reason ? (
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
                  <ListOrdered className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <p>{waitlistScenario.reason}</p>
                </div>
              ) : null}

              <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-charcoal">
                <p className="font-medium">{tour.title}</p>
                <p className="mt-1 text-slate">
                  {formatTourists(guests)}
                  {selectedDate
                    ? ` · ${formatDateRange(selectedDate.startDate, selectedDate.endDate)}`
                    : ""}
                </p>
              </div>

              <GuestCounter
                value={guests}
                min={guestLimits.min}
                max={Math.max(guestLimits.min, tour.groupMax)}
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
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, contactEmail: event.target.value }))
                }
              />
              <Input
                placeholder="Телефон"
                value={form.contactPhone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, contactPhone: event.target.value }))
                }
              />
              <Textarea
                placeholder="Комментарий: гибкость по датам, состав группы…"
                value={form.comments}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, comments: event.target.value }))
                }
                rows={3}
              />

              {error ? (
                <InlineFeedback variant="error" title="Проверьте форму" description={error} />
              ) : null}

              <Button type="button" className="w-full" loading={submitting} onClick={handleSubmit}>
                Встать в лист ожидания
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
