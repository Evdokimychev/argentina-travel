"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Lock, X } from "lucide-react";
import { TourDetail } from "@/types";
import { formatDays, formatForTourists, formatTourists, formatTouristsRange, formatSpots } from "@/lib/pluralize";
import { formatMinimumAgeSummary } from "@/lib/tour-age";
import { getGuestLimits } from "@/lib/tour-booking-spots";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FormattedPrice from "@/components/FormattedPrice";
import CheckoutCurrencySelector from "@/components/booking/CheckoutCurrencySelector";
import CheckoutPriceDisplay from "@/components/booking/CheckoutPriceDisplay";
import { useCheckoutCurrencyRates } from "@/hooks/useCheckoutCurrencyRates";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import {
  resolveDefaultCheckoutCurrency,
  type CheckoutCurrencyCode,
} from "@/lib/payments/checkout-currency";
import GuestCounter from "../GuestCounter";
import SingleDatePicker from "@/components/ui/single-date-picker";
import { useTourBooking } from "../TourBookingContext";
import BookingDateSelector, { validateBookingDates } from "../BookingDateSelector";
import {
  resolveTourCheckoutRoomOptions,
  tourCheckoutHasRoomSelection,
} from "@/lib/tour-checkout-accommodation";
import {
  maxBirthDateIso,
  minBirthDateIso,
  participantAgeLabel,
} from "@/lib/participant-age";
import {
  CHECKOUT_ROOM_OPTIONS,
  CHECKOUT_STEPS,
  CheckoutFormState,
  CheckoutStepId,
  createEmptyTraveler,
} from "./types";
import {
  ensureValidCheckoutPaymentOption,
  getEnabledCheckoutPaymentOptions,
  resolveCheckoutDepositAmountUsd,
  resolveTourCheckoutPaymentOptionsFromTour,
} from "@/lib/tour-checkout-payment";
import {
  calcRoomTotalUsd,
  createDefaultRoomAllocations,
  validateRoomAllocations,
} from "./checkout-accommodation";
import AccommodationStep from "./AccommodationStep";
import {
  CHECKOUT_ADDONS,
  INSURANCE_ADDON,
  TRANSFER_VEHICLE_OPTIONS,
  transferVehicleCount,
} from "./checkout-addons";
import {
  checkoutAddonsTotal,
  createDefaultTransferAllocations,
  isTransferEnabled,
  totalTransferAllocated,
  validateTransferAllocations,
} from "./checkout-transfer";
import TransferAddonPicker from "./TransferAddonPicker";
import InsuranceAddonPicker from "./InsuranceAddonPicker";
import { syncContactToTraveler1, createCheckoutForm, applyAuthUserToCheckoutForm } from "./checkout-contact";
import { useAuth } from "@/context/AuthContext";
import { createBookingFromCheckout } from "@/lib/bookings-store";
import { getStoredFirstTouchAttribution } from "@/lib/attribution/first-touch";
import { trackBookingSubmit } from "@/lib/analytics/gtm-events";
import { buildInsuranceHref } from "@/lib/insurance/checkout-link";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import BookingCheckoutStepper from "@/components/booking/BookingCheckoutStepper";
import BookingCheckoutProgress from "@/components/booking/BookingCheckoutProgress";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { normalizeSiteError, siteFormError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";

interface TourCheckoutModalProps {
  tour: TourDetail;
}

function getVisibleSteps(hasAccommodation: boolean) {
  return CHECKOUT_STEPS.filter(
    (step) => step.id !== "accommodation" || hasAccommodation
  );
}

function getInitialCheckoutStepIndex(
  tour: TourDetail,
  visibleSteps: ReturnType<typeof getVisibleSteps>,
  dateMode: ReturnType<typeof useTourBooking>["dateMode"],
  customDate: Date | null,
  guests: number,
  selectedDateId: string
): number {
  if (visibleSteps[0]?.id !== "travelers") return 0;
  const dateError = validateBookingDates(tour, dateMode, customDate, guests, selectedDateId);
  if (dateError) return 0;
  return visibleSteps.length > 1 ? 1 : 0;
}

function formatCheckoutDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function RequiredMark() {
  return (
    <span className="text-brand" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

function StepIndicator({
  steps,
  currentIndex,
}: {
  steps: ReadonlyArray<{ id: string; label: string }>;
  currentIndex: number;
}) {
  return (
    <ol className="flex flex-wrap gap-2">
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li
            key={step.id}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              done && "bg-sky/10 text-sky-dark",
              active && "bg-brand text-white",
              !done && !active && "bg-gray-100 text-slate"
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                done && "bg-sky text-white",
                active && "bg-white/20 text-white",
                !done && !active && "bg-white text-slate"
              )}
            >
              {done ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function CheckoutSummary({
  tour,
  form,
  guests,
  startLabel,
  endLabel,
  dateModeLabel,
  subtotalUsd,
  roomAllocations,
  roomOptions,
  totalUsd,
  payNowUsd,
  depositPercent,
  checkoutCurrency,
  checkoutRates,
}: {
  tour: TourDetail;
  form: CheckoutFormState;
  guests: number;
  startLabel: string;
  endLabel: string;
  dateModeLabel?: string;
  subtotalUsd: number;
  roomAllocations: CheckoutFormState["roomAllocations"];
  roomOptions: typeof CHECKOUT_ROOM_OPTIONS;
  totalUsd: number;
  payNowUsd: number;
  depositPercent: number;
  checkoutCurrency: CheckoutCurrencyCode;
  checkoutRates: Partial<Record<import("@/types/locale").CurrencyCode, number>>;
}) {
  const selectedAddons = CHECKOUT_ADDONS.filter((a) => form.addonIds.includes(a.id));

  return (
    <div className="flex h-full flex-col bg-gray-50 p-5">
      <h3 className="font-heading text-lg font-bold text-charcoal">Ваш тур</h3>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="relative aspect-[16/10] w-full">
          <Image
            src={tour.image}
            alt={tour.title}
            fill
            className="object-cover"
            sizes="340px"
          />
        </div>
        <div className="p-4">
          <p className="font-heading text-sm font-bold leading-snug text-charcoal">
            {tour.title}
          </p>
          <dl className="mt-3 space-y-2 text-xs text-slate">
            <div className="flex justify-between gap-3">
              <dt>Длительность</dt>
              <dd className="text-right font-medium text-charcoal">
                {formatDays(tour.durationDays)}
              </dd>
            </div>
            {dateModeLabel && (
              <div className="flex justify-between gap-3">
                <dt>Формат</dt>
                <dd className="text-right font-medium text-charcoal">{dateModeLabel}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt>Начало</dt>
              <dd className="text-right font-medium text-charcoal">{startLabel}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Окончание</dt>
              <dd className="text-right font-medium text-charcoal">{endLabel}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Туристы</dt>
              <dd className="text-right font-medium text-charcoal">
                {formatTourists(guests)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-xl border border-gray-200 bg-white p-4 text-sm">
        <div className="flex justify-between gap-3 text-slate">
          <span>Тур × {guests}</span>
          <FormattedPrice
            priceUsd={subtotalUsd}
            currency={checkoutCurrency}
            rates={checkoutRates}
            className="font-medium text-charcoal"
          />
        </div>
        {roomOptions.map((room) => {
          const count = roomAllocations[room.id];
          if (!count || room.priceUsdPerTraveler === 0) return null;
          return (
            <div key={room.id} className="flex justify-between gap-3 text-slate">
              <span className="min-w-0 truncate">
                {room.title} × {count}
              </span>
              <FormattedPrice
                priceUsd={count * room.priceUsdPerTraveler}
                currency={checkoutCurrency}
                rates={checkoutRates}
                className="shrink-0 font-medium text-charcoal"
              />
            </div>
          );
        })}
        {TRANSFER_VEHICLE_OPTIONS.map((vehicle) => {
          const passengers = form.transferAllocations[vehicle.id as keyof typeof form.transferAllocations];
          if (!passengers) return null;
          const vehicles = transferVehicleCount(passengers, vehicle.capacity);
          const lineTotal = vehicles * vehicle.priceUsd;
          return (
            <div key={vehicle.id} className="flex justify-between gap-3 text-slate">
              <span className="min-w-0">
                Трансфер ({vehicle.title.toLowerCase()}
                {vehicles > 1 ? ` × ${vehicles}` : ""})
              </span>
              <FormattedPrice
                priceUsd={lineTotal}
                currency={checkoutCurrency}
                rates={checkoutRates}
                className="shrink-0 font-medium text-charcoal"
              />
            </div>
          );
        })}
        {form.insuranceTravelers > 0 && (
          <div className="flex justify-between gap-3 text-slate">
            <span className="min-w-0 truncate">
              {INSURANCE_ADDON.title} × {form.insuranceTravelers}
            </span>
            <span className="shrink-0 text-xs font-medium text-sky">отдельно на /insurance</span>
          </div>
        )}
        {selectedAddons.map((addon) => (
          <div key={addon.id} className="flex justify-between gap-3 text-slate">
            <span className="min-w-0 truncate">{addon.title}</span>
            <FormattedPrice
              priceUsd={addon.priceUsd}
              currency={checkoutCurrency}
              rates={checkoutRates}
              className="shrink-0 font-medium text-charcoal"
            />
          </div>
        ))}
        <div className="flex justify-between gap-3 border-t border-gray-100 pt-3 font-heading text-base font-bold text-charcoal">
          <span>Итого</span>
          <FormattedPrice priceUsd={totalUsd} currency={checkoutCurrency} rates={checkoutRates} />
        </div>
        {form.paymentOption === "deposit" && (
          <div className="flex justify-between gap-3 text-sm text-brand">
            <span>К оплате сейчас ({depositPercent}%)</span>
            <FormattedPrice
              priceUsd={payNowUsd}
              currency={checkoutCurrency}
              rates={checkoutRates}
              className="font-semibold"
            />
          </div>
        )}
        {form.paymentOption === "later" && (
          <div className="flex justify-between gap-3 text-sm text-slate">
            <span>К оплате сейчас</span>
            <span className="font-semibold text-charcoal">Оплата позже</span>
          </div>
        )}
      </div>

      {(form.paymentOption === "full" || form.paymentOption === "deposit") ? (
        <p className="mt-auto flex items-center gap-2 pt-4 text-xs text-slate">
          <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Безопасное SSL-шифрование. Данные карты не сохраняются.
        </p>
      ) : (
        <p className="mt-auto pt-4 text-xs leading-relaxed text-slate">
          Оплата не требуется сейчас. Организатор пришлёт ссылку или реквизиты после подтверждения
          заявки.
        </p>
      )}
    </div>
  );
}

export default function TourCheckoutModal({ tour }: TourCheckoutModalProps) {
  const {
    checkoutOpen,
    closeCheckout,
    guests,
    setGuests,
    selectedDateId,
    dateMode,
    customDate,
    totalPriceUsd,
  } = useTourBooking();
  const { user, isAuthenticated, openAuth } = useAuth();
  const { currency: localeCurrency } = useLocaleCurrency();
  const { rates: checkoutRates, ratesUpdatedAt, ratesSource } = useCheckoutCurrencyRates();
  const [checkoutCurrency, setCheckoutCurrency] = useState<CheckoutCurrencyCode>(() =>
    resolveDefaultCheckoutCurrency(localeCurrency)
  );

  const roomOptions = useMemo(() => resolveTourCheckoutRoomOptions(tour), [tour]);
  const hasAccommodationStep = tourCheckoutHasRoomSelection(tour);
  const visibleSteps = useMemo(
    () => getVisibleSteps(hasAccommodationStep),
    [hasAccommodationStep]
  );
  const checkoutPaymentOptions = useMemo(
    () => resolveTourCheckoutPaymentOptionsFromTour(tour),
    [tour]
  );
  const enabledPaymentOptions = useMemo(
    () => getEnabledCheckoutPaymentOptions(checkoutPaymentOptions),
    [checkoutPaymentOptions]
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<CheckoutFormState>(() => {
    const options = resolveTourCheckoutRoomOptions(tour);
    const base = createCheckoutForm(guests, user, options);
    const paymentOption = ensureValidCheckoutPaymentOption(
      base.paymentOption,
      checkoutPaymentOptions
    );
    return { ...base, paymentOption };
  });
  const [submitted, setSubmitted] = useState(false);
  const [savedToProfile, setSavedToProfile] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [error, setErrorState] = useState<SiteFeedbackMessage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const feedback = useSiteFeedback();

  const setError = (value: string | SiteFeedbackMessage | null) => {
    if (value === null) {
      setErrorState(null);
      return;
    }
    setErrorState(typeof value === "string" ? siteFormError(value) : value);
  };

  const currentStep = visibleSteps[stepIndex]?.id ?? "travelers";
  const selectedDate = tour.dates.find((d) => d.id === selectedDateId);
  const guestLimits = getGuestLimits(tour, selectedDate, dateMode);
  const guestHint =
    dateMode === "scheduled" && selectedDate
      ? `${formatTouristsRange(guestLimits.min, guestLimits.max)}${tour.minimumAge ? `, ${formatMinimumAgeSummary(tour.minimumAge)}` : ""} · на эту дату ${formatSpots(selectedDate.spotsLeft)}`
      : undefined;

  const startLabel =
    dateMode === "custom" && customDate
      ? formatCheckoutDate(customDate)
      : selectedDate
        ? formatCheckoutDate(new Date(selectedDate.startDate))
        : "По запросу";

  const endLabel =
    dateMode === "custom" && customDate
      ? formatCheckoutDate(
          new Date(customDate.getTime() + (tour.durationDays - 1) * 86400000)
        )
      : selectedDate
        ? formatCheckoutDate(new Date(selectedDate.endDate))
        : "—";

  const roomTotalUsd = calcRoomTotalUsd(form.roomAllocations, roomOptions);
  const addonsTotalUsd = checkoutAddonsTotal(form.addonIds, form.transferAllocations);
  const subtotalUsd = totalPriceUsd;
  const totalUsd = subtotalUsd + roomTotalUsd + addonsTotalUsd;
  const payNowUsd =
    form.paymentOption === "deposit"
      ? resolveCheckoutDepositAmountUsd(totalUsd, checkoutPaymentOptions)
      : form.paymentOption === "later"
        ? 0
        : totalUsd;

  useEffect(() => {
    setForm((prev) => {
      const paymentOption = ensureValidCheckoutPaymentOption(
        prev.paymentOption,
        checkoutPaymentOptions
      );
      if (paymentOption === prev.paymentOption) return prev;
      return {
        ...prev,
        paymentOption,
        ...(paymentOption === "later"
          ? { cardNumber: "", cardExpiry: "", cardCvc: "" }
          : {}),
      };
    });
  }, [checkoutPaymentOptions]);

  const bookingMode = tour.bookingMode ?? "scheduled";
  const dateModeLabel =
    bookingMode === "both" || bookingMode === "on_request"
      ? dateMode === "custom"
        ? "Индивидуально"
        : "Групповой тур"
      : undefined;

  useEffect(() => {
    if (checkoutOpen) {
      document.body.style.overflow = "hidden";
      setStepIndex(
        getInitialCheckoutStepIndex(
          tour,
          visibleSteps,
          dateMode,
          customDate,
          guests,
          selectedDateId
        )
      );
      setSubmitted(false);
      setSavedToProfile(false);
      setError(null);
      setCheckoutCurrency(resolveDefaultCheckoutCurrency(localeCurrency));
      setForm(() => {
        const options = resolveTourCheckoutRoomOptions(tour);
        const base = createCheckoutForm(guests, user, options);
        const paymentOption = ensureValidCheckoutPaymentOption(
          base.paymentOption,
          checkoutPaymentOptions
        );
        return { ...base, paymentOption };
      });
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [checkoutOpen, guests, user, checkoutPaymentOptions, tour, visibleSteps, dateMode, customDate, selectedDateId, localeCurrency]);

  useEffect(() => {
    if (!checkoutOpen || !user) return;
    setForm((prev) => applyAuthUserToCheckoutForm(prev, user));
  }, [checkoutOpen, user?.id]);

  useEffect(() => {
    setForm((prev) => {
      const travelers = [...prev.travelers];
      while (travelers.length < guests) travelers.push(createEmptyTraveler());
      while (travelers.length > guests) travelers.pop();

      const allocated = Object.values(prev.roomAllocations).reduce((a, b) => a + b, 0);
      const roomAllocations =
        allocated === guests ? prev.roomAllocations : createDefaultRoomAllocations(guests, roomOptions);

      const transferAllocated = totalTransferAllocated(prev.transferAllocations);
      const transferAllocations =
        isTransferEnabled(prev.transferAllocations) && transferAllocated !== guests
          ? createDefaultTransferAllocations(guests)
          : prev.transferAllocations;

      const insuranceTravelers =
        prev.insuranceTravelers > 0
          ? Math.min(prev.insuranceTravelers, guests)
          : 0;

      return { ...prev, travelers, roomAllocations, transferAllocations, insuranceTravelers };
    });
  }, [guests, roomOptions]);

  function patchForm(patch: Partial<CheckoutFormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function patchContactFields(
    patch: Partial<
      Pick<
        CheckoutFormState,
        "contactFirstName" | "contactLastName" | "contactEmail" | "contactPhone" | "contactDateOfBirth" | "contactIsParticipant1"
      >
    >
  ) {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (next.contactIsParticipant1) {
        next.travelers = syncContactToTraveler1(next);
      }
      return next;
    });
  }

  function toggleAddon(id: string) {
    setForm((prev) => ({
      ...prev,
      addonIds: prev.addonIds.includes(id)
        ? prev.addonIds.filter((x) => x !== id)
        : [...prev.addonIds, id],
    }));
  }

  function validateStep(step: CheckoutStepId): string | null {
    if (step === "travelers") {
      return validateBookingDates(tour, dateMode, customDate, guests, selectedDateId);
    }
    if (step === "accommodation") {
      return validateRoomAllocations(form.roomAllocations, guests, roomOptions);
    }
    if (step === "addons") {
      return validateTransferAllocations(form.transferAllocations, guests);
    }
    if (step === "details") {
      if (!form.contactFirstName.trim() || !form.contactLastName.trim()) {
        return "Укажите имя и фамилию контактного лица";
      }
      if (!form.contactEmail.trim() || !form.contactEmail.includes("@")) {
        return "Укажите корректный email";
      }
      if (!form.contactPhone.trim()) return "Укажите телефон";
      if (!form.fillTravelersLater) {
        const missingTraveler = form.travelers.find(
          (t) => !t.firstName.trim() || !t.lastName.trim() || !t.dateOfBirth
        );
        if (missingTraveler) {
          return "Заполните ФИО и дату рождения всех участников";
        }
      }
    }
    if (step === "payment") {
      if (form.paymentOption !== "later") {
        return "Сейчас доступна только заявка без оплаты. Выберите «Оплатить позже».";
      }
    }
    return null;
  }

  function goNext() {
    const err = validateStep(currentStep);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (stepIndex < visibleSteps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      void submitCheckout();
    }
  }

  async function submitCheckout() {
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

    const bookingResult = await createBookingFromCheckout({
      actor: user,
      userId: user?.id,
      tour,
      guests,
      startDate,
      endDate,
      totalPriceUsd: totalUsd,
      form,
      checkoutCurrency,
      checkoutRates,
      checkoutRatesUpdatedAt: ratesUpdatedAt,
      checkoutRatesSource: ratesSource,
      payNowUsd,
      attribution: getStoredFirstTouchAttribution() ?? undefined,
    });

    if ("error" in bookingResult) {
      const normalized = normalizeSiteError(bookingResult.error, {
        title: "Не удалось отправить заявку",
        steps: ["Проверьте контактные данные", "Попробуйте ещё раз или свяжитесь с организатором"],
      });
      setError(normalized);
      feedback.showError(normalized);
      setSubmitting(false);
      return;
    }

    if (user) {
      setSavedToProfile(true);
    }
    setCreatedBookingId(bookingResult.id);
    setSubmitted(true);
    trackBookingSubmit({
      productType: "tour",
      slug: tour.slug,
      title: tour.title,
      guests,
      valueUsd: totalUsd,
      source: "checkout_modal",
    });
    setSubmitting(false);
    feedback.success({
      title: "Заявка отправлена",
      description: savedToProfile || user
        ? "Заявка сохранена в личном кабинете — следите за статусом в разделе «Бронирования»."
        : "Организатор свяжется с вами по указанному email.",
      action: user ? { label: "Мои бронирования", href: "/profile/bookings" } : undefined,
    });
  }

  function goBack() {
    setError(null);
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }

  return (
    <Dialog open={checkoutOpen} onOpenChange={(next) => !next && closeCheckout()}>
      <DialogContent
        bottomSheet
        className="flex h-[100dvh] max-w-6xl flex-col overflow-hidden p-0 shadow-2xl sm:h-auto sm:max-h-[92vh] lg:flex-row"
        onPointerDownOutside={closeCheckout}
        onEscapeKeyDown={closeCheckout}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate">
                Бронирование
              </p>
              <DialogTitle className="font-heading text-xl font-bold text-charcoal">
                {submitted ? "Заявка отправлена" : "Подтверждение и оплата"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {submitted
                  ? "Заявка на бронирование тура отправлена организатору"
                  : "Пошаговое оформление заявки на бронирование тура"}
              </DialogDescription>
              {!submitted && (
                <div className="mt-3 space-y-3">
                  <BookingCheckoutStepper
                    currentStep={
                      currentStep === "details" || currentStep === "payment"
                        ? "contacts"
                        : "dates"
                    }
                  />
                  <BookingCheckoutProgress
                    currentStep={
                      currentStep === "details" || currentStep === "payment"
                        ? "contacts"
                        : "dates"
                    }
                  />
                  <StepIndicator steps={visibleSteps} currentIndex={stepIndex} />
                </div>
              )}
              {submitted ? (
                <div className="mt-3 space-y-3">
                  <BookingCheckoutStepper currentStep="payment" />
                  <BookingCheckoutProgress currentStep="payment" />
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={closeCheckout}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate transition-colors hover:bg-gray-100 hover:text-charcoal"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {submitted ? (
              <div className="mx-auto max-w-md py-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky/10 text-sky">
                  <Check className="h-8 w-8" strokeWidth={2.5} />
                </div>
                <h3 className="mt-5 font-heading text-2xl font-bold text-charcoal">
                  Спасибо за бронирование!
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">
                  {savedToProfile ? (
                    <>
                      Заявка сохранена в профиле. Уведомление о статусе — в разделе «Обзор» и на{" "}
                      <span className="font-medium text-charcoal">{form.contactEmail}</span> (когда
                      подключим email).
                    </>
                  ) : (
                    <>
                      Заявка сохранена в браузере. Организатор свяжется по{" "}
                      <span className="font-medium text-charcoal">{form.contactEmail}</span>.
                    </>
                  )}{" "}
                  {form.paymentOption === "later" ? (
                    <>
                      Оплата через платформу скоро — сейчас списание не производится. После
                      подтверждения откройте ссылку на оплату из уведомлений или личного кабинета.
                    </>
                  ) : (
                    <>
                      Оплата картой на сайте появится позже. Организатор пришлёт ссылку на
                      предоплату после подтверждения заявки.
                    </>
                  )}
                  {form.fillTravelersLater
                    ? " Заполните данные участников по ссылке из уведомлений."
                    : null}
                </p>
                {savedToProfile && createdBookingId ? (
                  <p className="mt-3 text-sm text-sky-dark">
                    <Link
                      href={`/profile/bookings/${createdBookingId}`}
                      className="font-medium underline"
                    >
                      Открыть заявку
                    </Link>
                    {" · "}
                    <Link href="/profile/bookings" className="font-medium underline">
                      все бронирования
                    </Link>
                  </p>
                ) : null}
                {!savedToProfile ? (
                  <div className="mt-4 rounded-xl border border-brand/20 bg-brand-light/20 px-4 py-4 text-left text-sm">
                    <p className="font-medium text-charcoal">Создайте аккаунт — заявка привяжется автоматически</p>
                    <p className="mt-1 text-slate">
                      Используйте тот же email: {form.contactEmail}
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => openAuth()}>
                        Создать аккаунт
                      </Button>
                      <Link
                        href={`/booking/find?email=${encodeURIComponent(form.contactEmail)}`}
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-charcoal hover:bg-gray-50"
                      >
                        Найти заявку
                      </Link>
                    </div>
                  </div>
                ) : null}
                {form.insuranceTravelers > 0 ? (
                  <div className="mt-4 rounded-xl border border-sky/20 bg-sky/5 px-4 py-4 text-left text-sm">
                    <p className="font-medium text-charcoal">Оформите страховку для поездки</p>
                    <p className="mt-1 text-slate">
                      Полис для {formatForTourists(form.insuranceTravelers)} — на сайте партнёра,
                      отдельно от оплаты тура.
                    </p>
                    <Link
                      href={buildInsuranceHref({ travelers: form.insuranceTravelers })}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-sky px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-dark"
                    >
                      Перейти к подбору полиса
                    </Link>
                  </div>
                ) : null}
                <Button className="mt-6 w-full" onClick={closeCheckout}>
                  Вернуться к туру
                </Button>
                {savedToProfile ? (
                  <Link
                    href={createdBookingId ? `/profile/bookings/${createdBookingId}` : "/profile/bookings"}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-charcoal hover:bg-gray-50"
                  >
                    {createdBookingId ? "Открыть заявку" : "Мои бронирования"}
                  </Link>
                ) : null}
              </div>
            ) : (
              <>
                {currentStep === "travelers" && (
                  <section className="mx-auto max-w-xl space-y-5">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-charcoal">
                        1. Туристы
                      </h3>
                      <p className="mt-1 text-sm text-slate">
                        Проверьте даты и количество участников
                      </p>
                    </div>
                    <BookingDateSelector
                      tour={tour}
                      idPrefix="checkout"
                      collapsible
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                    />
                    <GuestCounter
                      value={guests}
                      min={guestLimits.min}
                      max={Math.max(guestLimits.min, guestLimits.max)}
                      minimumAge={tour.minimumAge}
                      hint={guestHint}
                      onChange={setGuests}
                    />
                  </section>
                )}

                {currentStep === "accommodation" && (
                  <AccommodationStep
                    guests={guests}
                    allocations={form.roomAllocations}
                    roomOptions={roomOptions}
                    onChange={(roomAllocations) => patchForm({ roomAllocations })}
                    onViewDetails={() => {
                      closeCheckout();
                      requestAnimationFrame(() => {
                        document.getElementById("accommodations")?.scrollIntoView({
                          behavior: "smooth",
                        });
                      });
                    }}
                  />
                )}

                {currentStep === "addons" && (
                  <section className="mx-auto max-w-xl space-y-4">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-charcoal">
                        {hasAccommodationStep ? "3" : "2"}. Дополнения
                      </h3>
                      <p className="mt-1 text-sm text-slate">Необязательные услуги к туру</p>
                    </div>
                    <ul className="space-y-3">
                      <TransferAddonPicker
                        guests={guests}
                        allocations={form.transferAllocations}
                        onChange={(transferAllocations) => patchForm({ transferAllocations })}
                      />
                      <InsuranceAddonPicker
                        guests={guests}
                        count={form.insuranceTravelers}
                        onChange={(insuranceTravelers) => patchForm({ insuranceTravelers })}
                      />
                      {CHECKOUT_ADDONS.map((addon) => {
                        const selected = form.addonIds.includes(addon.id);
                        return (
                          <li key={addon.id}>
                            <label
                              className={cn(
                                "flex cursor-pointer gap-3 rounded-xl border p-4 transition-all",
                                selected
                                  ? "border-brand bg-brand-light/30"
                                  : "border-gray-200 hover:border-gray-300"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleAddon(addon.id)}
                                className="mt-1 h-4 w-4 accent-brand"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="flex items-start justify-between gap-3">
                                  <span className="font-medium text-charcoal">{addon.title}</span>
                                  <FormattedPrice
                                    priceUsd={addon.priceUsd}
                                    className="shrink-0 text-sm font-semibold text-charcoal"
                                  />
                                </span>
                                <span className="mt-1 block text-sm text-slate">
                                  {addon.description}
                                </span>
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}

                {currentStep === "details" && (
                  <section className="mx-auto max-w-xl space-y-8">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-charcoal">
                        {hasAccommodationStep ? "4" : "3"}. Данные путешественников
                      </h3>
                      <p className="mt-1 text-sm text-slate">
                        Контакт для бронирования и данные всех участников
                      </p>
                    </div>

                    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                      <div>
                        <h4 className="text-sm font-semibold text-charcoal">Контактное лицо</h4>
                        <p className="mt-0.5 text-xs text-slate">
                          Получит подтверждение и ссылку на личный кабинет
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="contact-first-name"
                              className="mb-1.5 block text-xs font-medium text-charcoal"
                            >
                              Имя
                              <RequiredMark />
                            </label>
                            <Input
                              id="contact-first-name"
                              placeholder="Имя"
                              value={form.contactFirstName}
                              onChange={(e) =>
                                patchContactFields({ contactFirstName: e.target.value })
                              }
                              required
                              aria-required="true"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="contact-last-name"
                              className="mb-1.5 block text-xs font-medium text-charcoal"
                            >
                              Фамилия
                              <RequiredMark />
                            </label>
                            <Input
                              id="contact-last-name"
                              placeholder="Фамилия"
                              value={form.contactLastName}
                              onChange={(e) =>
                                patchContactFields({ contactLastName: e.target.value })
                              }
                              required
                              aria-required="true"
                            />
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="contact-email"
                            className="mb-1.5 block text-xs font-medium text-charcoal"
                          >
                            Email
                            <RequiredMark />
                          </label>
                          <Input
                            id="contact-email"
                            type="email"
                            placeholder="email@example.com"
                            value={form.contactEmail}
                            onChange={(e) => patchContactFields({ contactEmail: e.target.value })}
                            required
                            aria-required="true"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="contact-phone"
                            className="mb-1.5 block text-xs font-medium text-charcoal"
                          >
                            Телефон
                            <RequiredMark />
                          </label>
                          <Input
                            id="contact-phone"
                            type="tel"
                            placeholder="+54 9 11 1234-5678"
                            value={form.contactPhone}
                            onChange={(e) => patchContactFields({ contactPhone: e.target.value })}
                            required
                            aria-required="true"
                          />
                        </div>
                        {form.contactIsParticipant1 && (
                          <div>
                            <label
                              htmlFor="contact-dob"
                              className="mb-1.5 block text-xs font-medium text-charcoal"
                            >
                              Дата рождения
                              <RequiredMark />
                            </label>
                            <SingleDatePicker
                              id="contact-dob"
                              value={form.contactDateOfBirth}
                              onChange={(contactDateOfBirth) =>
                                patchContactFields({ contactDateOfBirth })
                              }
                              min={minBirthDateIso()}
                              max={maxBirthDateIso()}
                              birthDatePicker
                              placeholder="ДД.ММ.ГГГГ"
                            />
                          </div>
                        )}

                        {isAuthenticated && user ? (
                          <div className="rounded-lg border border-sky/15 bg-sky/5 px-3 py-2.5 text-xs leading-relaxed text-sky-dark">
                            Данные подставлены из вашего профиля — бронирование будет привязано к
                            аккаунту.
                          </div>
                        ) : (
                          <div className="space-y-2.5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                            <p className="text-sm text-charcoal">
                              Уже есть аккаунт?{" "}
                              <button
                                type="button"
                                onClick={() => openAuth()}
                                className="font-semibold text-brand transition-colors hover:text-brand-dark"
                              >
                                Войти
                              </button>
                            </p>
                            <label className="flex cursor-pointer items-start gap-2.5">
                              <input
                                type="checkbox"
                                checked={form.createAccount}
                                onChange={(e) => patchForm({ createAccount: e.target.checked })}
                                className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                              />
                              <span className="min-w-0 text-sm leading-snug text-charcoal">
                                <span className="font-medium">Зарегистрироваться на сайте</span>
                                <span className="mt-0.5 block text-xs text-slate">
                                  Личный кабинет на email — бронирование и переписка с организатором
                                </span>
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-charcoal">Участники поездки</h4>
                        <p className="mt-0.5 text-xs text-slate">
                          Имена и даты рождения всех туристов в туре
                        </p>
                      </div>

                      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={form.fillTravelersLater}
                          onChange={(e) => patchForm({ fillTravelersLater: e.target.checked })}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                        />
                        <span className="min-w-0 text-sm leading-snug text-charcoal">
                          <span className="font-medium">Указать данные участников позже</span>
                          <span className="mt-0.5 block text-xs text-slate">
                            Ссылка на email после бронирования — заполнить в течение 48 часов
                          </span>
                        </span>
                      </label>

                    {!form.fillTravelersLater ? (
                    <div className="space-y-3">
                      {form.travelers.map((traveler, index) => {
                        const ageLabel = participantAgeLabel(traveler.dateOfBirth);
                        return (
                        <div
                          key={index}
                          className="space-y-3 rounded-xl border border-gray-200 bg-white p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate">
                              Участник {index + 1}
                            </p>
                            {index === 0 && (
                              <label className="flex cursor-pointer items-center gap-2 text-xs text-charcoal">
                                <input
                                  type="checkbox"
                                  checked={form.contactIsParticipant1}
                                  onChange={(e) =>
                                    patchContactFields({ contactIsParticipant1: e.target.checked })
                                  }
                                  className="h-3.5 w-3.5 accent-brand"
                                />
                                <span>Из контактного лица</span>
                              </label>
                            )}
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Input
                              placeholder="Имя"
                              value={traveler.firstName}
                              disabled={index === 0 && form.contactIsParticipant1}
                              className={cn(
                                index === 0 &&
                                  form.contactIsParticipant1 &&
                                  "cursor-not-allowed opacity-60"
                              )}
                              onChange={(e) => {
                                const travelers = [...form.travelers];
                                travelers[index] = {
                                  ...travelers[index],
                                  firstName: e.target.value,
                                };
                                patchForm({ travelers });
                              }}
                            />
                            <Input
                              placeholder="Фамилия"
                              value={traveler.lastName}
                              disabled={index === 0 && form.contactIsParticipant1}
                              className={cn(
                                index === 0 &&
                                  form.contactIsParticipant1 &&
                                  "cursor-not-allowed opacity-60"
                              )}
                              onChange={(e) => {
                                const travelers = [...form.travelers];
                                travelers[index] = {
                                  ...travelers[index],
                                  lastName: e.target.value,
                                };
                                patchForm({ travelers });
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                            <div className="min-w-0 flex-1">
                              <label
                                htmlFor={`traveler-dob-${index}`}
                                className="mb-1.5 block text-xs font-medium text-charcoal"
                              >
                                Дата рождения
                              </label>
                              <SingleDatePicker
                                id={`traveler-dob-${index}`}
                                value={traveler.dateOfBirth}
                                disabled={index === 0 && form.contactIsParticipant1}
                                onChange={(dateOfBirth) => {
                                  const travelers = [...form.travelers];
                                  travelers[index] = { ...travelers[index], dateOfBirth };
                                  patchForm({ travelers });
                                }}
                                min={minBirthDateIso()}
                                max={maxBirthDateIso()}
                                birthDatePicker
                                placeholder="ДД.ММ.ГГГГ"
                              />
                            </div>
                            {ageLabel && (
                              <p className="shrink-0 rounded-full bg-sky/10 px-3 py-2 text-sm font-medium text-sky">
                                Возраст: {ageLabel}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                      })}
                    </div>
                    ) : null}
                    </div>

                    <div className="space-y-3 border-t border-gray-100 pt-6">
                      <div>
                        <h4 className="text-sm font-semibold text-charcoal">
                          Комментарий или особые пожелания
                        </h4>
                        <p className="mt-0.5 text-xs text-slate">Необязательно</p>
                      </div>
                      <Textarea
                        value={form.comments}
                        onChange={(e) => patchForm({ comments: e.target.value })}
                        rows={3}
                        placeholder="Аллергии, диетические предпочтения, время прилёта…"
                      />
                    </div>
                  </section>
                )}

                {currentStep === "payment" && (
                  <section className="mx-auto max-w-xl space-y-5">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-charcoal">
                        {hasAccommodationStep ? "5" : "4"}. Оплата
                      </h3>
                      <p className="mt-1 text-sm text-slate">
                        Оформите заявку — организатор подтвердит детали и пришлёт ссылку на оплату
                      </p>
                    </div>

                    <CheckoutCurrencySelector
                      value={checkoutCurrency}
                      onChange={setCheckoutCurrency}
                    />

                    <CheckoutPriceDisplay
                      amountUsd={totalUsd}
                      currency={checkoutCurrency}
                      rates={checkoutRates}
                      amountClassName="text-2xl"
                      secondaryAmountUsd={form.paymentOption !== "later" ? payNowUsd : undefined}
                      secondaryLabel={
                        form.paymentOption === "deposit"
                          ? `К оплате сейчас (${checkoutPaymentOptions.depositPercent}%)`
                          : form.paymentOption === "full"
                            ? "К оплате сейчас"
                            : undefined
                      }
                    />

                    <div className="flex rounded-xl bg-gray-100 p-1">
                      {enabledPaymentOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            patchForm({
                              paymentOption: opt.id,
                              ...(opt.id === "later"
                                ? { cardNumber: "", cardExpiry: "", cardCvc: "" }
                                : {}),
                            })
                          }
                          className={cn(
                            "flex-1 rounded-lg px-2 py-2.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
                            form.paymentOption === opt.id
                              ? "bg-white text-charcoal shadow-sm"
                              : "text-slate hover:text-charcoal"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {form.paymentOption === "later" ? (
                      <div className="rounded-xl border border-sky-200/70 bg-sky-50/50 px-4 py-3 text-sm leading-relaxed text-charcoal">
                        Заявка будет отправлена организатору без списания средств. После
                        подтверждения вы получите ссылку на оплату предоплаты или полной суммы.
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-charcoal">
                        Оплата картой на сайте появится позже. Пожалуйста, выберите «Оплатить позже»
                        и отправьте заявку организатору.
                      </div>
                    )}

                  </section>
                )}

                {error ? (
                  <InlineFeedback
                    variant="error"
                    title={error.title}
                    description={error.description}
                    steps={error.steps}
                    action={error.action}
                    className="mx-auto mt-4 max-w-xl"
                  />
                ) : null}
              </>
            )}
          </div>

          {!submitted && (
            <>
              <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-5 py-3 lg:hidden">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate">Итого за {formatForTourists(guests)}</p>
                    <FormattedPrice
                      priceUsd={totalUsd}
                      currency={checkoutCurrency}
                      rates={checkoutRates}
                      className="font-heading text-lg font-bold text-charcoal"
                    />
                  </div>
                  <p className="text-right text-xs text-slate">
                    {form.paymentOption === "later" ? (
                      <span className="font-medium text-charcoal">Оплата позже</span>
                    ) : (
                      <>
                        К оплате сейчас{" "}
                        <FormattedPrice
                          priceUsd={payNowUsd}
                          currency={checkoutCurrency}
                          rates={checkoutRates}
                          className="block font-semibold text-charcoal"
                        />
                      </>
                    )}
                  </p>
                </div>
              </div>
              <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={stepIndex === 0}
                className={cn(stepIndex === 0 && "invisible")}
              >
                <ChevronLeft className="h-4 w-4" />
                Назад
              </Button>
              <Button
                type="button"
                onClick={goNext}
                className="min-w-[140px]"
                loading={submitting}
                loadingLabel="Отправка…"
              >
                {stepIndex === visibleSteps.length - 1 ? (
                  form.paymentOption === "later" ? "Отправить заявку" : "Забронировать"
                ) : (
                  <>
                    Далее
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </footer>
            </>
          )}
        </div>

        <aside className="hidden w-[340px] shrink-0 overflow-y-auto border-l border-gray-100 lg:block">
          <CheckoutSummary
            tour={tour}
            form={form}
            guests={guests}
            startLabel={startLabel}
            endLabel={endLabel}
            dateModeLabel={dateModeLabel}
            subtotalUsd={subtotalUsd}
            roomAllocations={form.roomAllocations}
            roomOptions={roomOptions}
            totalUsd={totalUsd}
            payNowUsd={payNowUsd}
            depositPercent={checkoutPaymentOptions.depositPercent}
            checkoutCurrency={checkoutCurrency}
            checkoutRates={checkoutRates}
          />
        </aside>
      </DialogContent>
    </Dialog>
  );
}
