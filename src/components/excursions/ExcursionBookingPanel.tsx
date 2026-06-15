"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GuestCounter from "@/components/tour-detail/GuestCounter";
import TourPriceDisplay from "@/components/tour-detail/TourPriceDisplay";
import ExcursionScheduleDatePicker from "@/components/excursions/ExcursionScheduleDatePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { cn } from "@/lib/cn";
import { siteStickyPanelMaxHeightClass, siteStickyPanelTopClass } from "@/lib/site-container";
import { excursionPriceSuffixKey } from "@/lib/excursion-listing-meta";
import {
  resolveExcursionPriceUsd,
  resolveExcursionQuotePriceUsd,
  resolvePartnerPriceFootnote,
} from "@/lib/excursion-price-display";
import type { ExcursionScheduleDate } from "@/lib/excursion-schedule";
import type { ExcursionDetail } from "@/types/excursion";
import type { TripsterPriceQuote } from "@/lib/tripster/types";

type ExcursionBookingPanelProps = {
  excursion: ExcursionDetail;
  className?: string;
};

export default function ExcursionBookingPanel({ excursion, className }: ExcursionBookingPanelProps) {
  const { t, locale, currency } = useLocaleCurrency();
  const { user, isAuthenticated, openAuth } = useAuth();

  const [scheduleDates, setScheduleDates] = useState<ExcursionScheduleDate[]>([]);
  const [scheduleMaxPersons, setScheduleMaxPersons] = useState<number | undefined>();
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [persons, setPersons] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [quote, setQuote] = useState<TripsterPriceQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const maxPersons = scheduleMaxPersons ?? excursion.maxPersons ?? 10;

  useEffect(() => {
    if (user) {
      setName((current) => current || user.fullName || "");
      setEmail((current) => current || user.email || "");
      setPhone((current) => current || user.phone || "");
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function loadSchedule() {
      setScheduleLoading(true);
      setScheduleError(null);
      try {
        const response = await fetch(`/api/excursions/${excursion.slug}/schedule`);
        const data = (await response.json()) as {
          error?: string;
          dates?: ExcursionScheduleDate[];
          maxPersons?: number;
        };
        if (!response.ok) throw new Error(data.error ?? "Schedule unavailable");
        if (cancelled) return;

        const dates = data.dates ?? [];
        setScheduleDates(dates);
        setScheduleMaxPersons(data.maxPersons);
        if (dates[0]) {
          setSelectedDate(dates[0].date);
          setSelectedTime(dates[0].slots[0]?.time ?? "");
        }
      } catch (error) {
        if (!cancelled) {
          setScheduleError(error instanceof Error ? error.message : "Schedule unavailable");
        }
      } finally {
        if (!cancelled) setScheduleLoading(false);
      }
    }

    void loadSchedule();
    return () => {
      cancelled = true;
    };
  }, [excursion.slug]);

  const selectedSlots = useMemo(
    () => scheduleDates.find((entry) => entry.date === selectedDate)?.slots ?? [],
    [scheduleDates, selectedDate]
  );

  useEffect(() => {
    if (selectedSlots.length > 0 && !selectedSlots.some((slot) => slot.time === selectedTime)) {
      setSelectedTime(selectedSlots[0]?.time ?? "");
    }
  }, [selectedSlots, selectedTime]);

  useEffect(() => {
    if (!selectedDate || !selectedTime) {
      setQuote(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const params = new URLSearchParams({
          date: selectedDate,
          time: selectedTime,
          persons: String(persons),
        });
        const response = await fetch(`/api/excursions/${excursion.slug}/price?${params}`);
        const data = (await response.json()) as { quote?: TripsterPriceQuote; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Price unavailable");
        if (!cancelled) setQuote(data.quote ?? null);
      } catch {
        if (!cancelled) setQuote(null);
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [excursion.slug, selectedDate, selectedTime, persons]);

  const priceUsd =
    resolveExcursionQuotePriceUsd(excursion, quote) ?? resolveExcursionPriceUsd(excursion);
  const priceUnit = excursion.priceUnit ?? "per_excursion";
  const showFrom = excursion.priceFrom !== false && !quote;
  const priceSuffix = t(excursionPriceSuffixKey(priceUnit));
  const partnerPriceFootnote = resolvePartnerPriceFootnote(
    excursion,
    quote,
    priceUsd,
    currency,
    t
  );

  const handleSubmit = useCallback(async () => {
    setFormError(null);

    if (!isAuthenticated) {
      openAuth();
      return;
    }

    if (!selectedDate || !selectedTime) {
      setFormError(t("excursions.booking.pickDateTime"));
      return;
    }

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setFormError(t("excursions.booking.fillContacts"));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/excursions/${excursion.slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          personsCount: persons,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          messageToGuide: message.trim() || undefined,
          userId: user?.id,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        mode?: string;
        orderUrl?: string;
        fallbackUrl?: string;
        error?: string;
        details?: Record<string, string[] | { non_field_errors?: string[] }>;
      };

      if (data.mode === "affiliate_fallback" && data.fallbackUrl) {
        window.location.href = data.fallbackUrl;
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

      if (data.orderUrl) {
        window.location.href = data.orderUrl;
        return;
      }

      setFormError(t("excursions.booking.failed"));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("excursions.booking.failed"));
    } finally {
      setSubmitting(false);
    }
  }, [
    email,
    excursion.slug,
    isAuthenticated,
    message,
    name,
    openAuth,
    persons,
    phone,
    selectedDate,
    selectedTime,
    t,
    user?.id,
  ]);

  const scheduleDateKeys = useMemo(
    () => scheduleDates.map((entry) => entry.date),
    [scheduleDates]
  );

  const partnerDisclaimerKey =
    excursion.partner === "sputnik8"
      ? "excursions.partnerDisclaimer.sputnik8"
      : "excursions.partnerDisclaimer.tripster";

  const prefersAffiliate =
    excursion.partner === "sputnik8" &&
    !scheduleLoading &&
    (scheduleError != null || scheduleDates.length === 0);

  const canBookOnSite = excursion.isBookable !== false && !prefersAffiliate;
  const listedPriceLabel =
    quote?.value_string?.trim() ||
    excursion.priceDisplay?.trim() ||
    (excursion.priceValue != null
      ? `${Math.round(excursion.priceValue)}${excursion.priceCurrency ? ` ${excursion.priceCurrency}` : ""}`
      : null);
  const hasListedPrice = priceUsd != null || Boolean(listedPriceLabel);

  return (
    <aside
      id="booking"
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:sticky lg:z-30 lg:self-start lg:overflow-y-auto",
        siteStickyPanelTopClass,
        siteStickyPanelMaxHeightClass,
        className
      )}
    >
      {priceUsd != null ? (
        <div className={quoteLoading ? "opacity-70 transition-opacity" : undefined}>
          <TourPriceDisplay
            priceUsd={priceUsd}
            size="lg"
            showFrom={showFrom}
            suffix={priceSuffix}
            showDiscountRibbon={false}
          />
        </div>
      ) : hasListedPrice && listedPriceLabel ? (
        <p className="font-heading text-2xl font-bold text-charcoal">{listedPriceLabel}</p>
      ) : (
        <p className="text-sm text-slate">{t("excursions.priceOnPartner")}</p>
      )}

      {partnerPriceFootnote ? (
        <p className="mt-2 text-[11px] leading-relaxed text-slate/75">{partnerPriceFootnote}</p>
      ) : null}

      {canBookOnSite ? (
        <div className="mt-5 space-y-4">
          {scheduleLoading ? (
            <p className="text-sm text-slate">{t("excursions.booking.loadingSchedule")}</p>
          ) : scheduleError || scheduleDates.length === 0 ? (
            <p className="text-sm text-slate">{t("excursions.booking.scheduleUnavailable")}</p>
          ) : (
            <>
              <ExcursionScheduleDatePicker
                dates={scheduleDateKeys}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                locale={locale}
                label={t("excursions.booking.date")}
                placeholder={t("excursions.booking.pickDate")}
              />

              {selectedSlots.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-charcoal">{t("excursions.booking.time")}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSlots.map((slot) => (
                      <button
                        key={`${slot.time}-${slot.timeEnd ?? ""}`}
                        type="button"
                        onClick={() => setSelectedTime(slot.time)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-xs font-medium transition",
                          selectedTime === slot.time
                            ? "border-sky bg-sky text-white"
                            : "border-gray-200 text-charcoal hover:border-sky/40"
                        )}
                      >
                        {slot.time}
                        {slot.timeEnd ? `–${slot.timeEnd}` : ""}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <GuestCounter
                value={persons}
                min={1}
                max={maxPersons}
                onChange={setPersons}
              />
            </>
          )}

          <div className="space-y-3 border-t border-gray-100 pt-4">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("excursions.booking.name")}
              autoComplete="name"
            />
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("excursions.booking.email")}
              autoComplete="email"
            />
            <Input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={t("excursions.booking.phone")}
              autoComplete="tel"
            />
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t("excursions.booking.message")}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none ring-sky/30 focus:border-sky focus:ring-2"
            />
          </div>

          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

          <Button
            type="button"
            className="w-full"
            disabled={submitting || scheduleLoading}
            onClick={() => void handleSubmit()}
          >
            {submitting ? t("excursions.booking.submitting") : t("excursions.booking.submit")}
          </Button>

          <p className="text-xs leading-relaxed text-slate">{t("excursions.booking.disclaimer")}</p>
        </div>
      ) : (
        <>
          <a
            href={excursion.bookingHref}
            className="mt-5 flex w-full items-center justify-center rounded-xl bg-sky px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-sky/90"
          >
            {t("excursions.book")}
          </a>
          <p className="mt-3 text-xs leading-relaxed text-slate">{t(partnerDisclaimerKey)}</p>
        </>
      )}
    </aside>
  );
}
