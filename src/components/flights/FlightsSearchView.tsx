"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Plane } from "lucide-react";
import Hero from "@/components/Hero";
import FlightOfferCard from "@/components/flights/FlightOfferCard";
import FlightPopularRoutes from "@/components/flights/FlightPopularRoutes";
import FlightSearchForm, {
  type FlightSearchFormState,
} from "@/components/flights/FlightSearchForm";
import { buttonVariants } from "@/components/ui/button";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/utils";
import type { AviasalesPlace, FlightPriceOffer } from "@/lib/travelpayouts/aviasales/types";

function defaultDepartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
}

function defaultReturnDate(departDate: string): string {
  const date = new Date(`${departDate}T12:00:00`);
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function placeFromCode(code: string, name?: string): AviasalesPlace {
  const normalized = code.trim().toUpperCase();
  return {
    code: normalized,
    name: name?.trim() || normalized,
    type: "city",
  };
}

function buildAffiliateSearchUrl(
  state: FlightSearchFormState,
  locale: string
): string {
  if (!state.origin || !state.destination || !state.departDate) return "";

  const params = new URLSearchParams({
    origin: state.origin.code,
    destination: state.destination.code,
    departDate: state.departDate,
    adults: String(state.adults),
    children: String(state.children),
    infants: String(state.infants),
    tripType: state.tripType,
    locale,
  });

  if (state.tripType === "round_trip" && state.returnDate) {
    params.set("returnDate", state.returnDate);
  }

  return `/api/affiliate/flights/search?${params}`;
}

export default function FlightsSearchView() {
  const searchParams = useSearchParams();
  const { t, locale, currency } = useLocaleCurrency();
  const [formState, setFormState] = useState<FlightSearchFormState>(() => {
    const departDate = defaultDepartDate();
    return {
      origin: null,
      destination: null,
      departDate,
      returnDate: defaultReturnDate(departDate),
      tripType: "round_trip",
      adults: 1,
      children: 0,
      infants: 0,
    };
  });
  const [offers, setOffers] = useState<FlightPriceOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const origin = searchParams.get("origin");
    const destination = searchParams.get("destination");
    if (!origin && !destination) return;

    setFormState((prev) => ({
      ...prev,
      origin: origin ? placeFromCode(origin) : prev.origin,
      destination: destination ? placeFromCode(destination) : prev.destination,
    }));
  }, [searchParams]);

  const routeKey = useMemo(() => {
    if (!formState.origin || !formState.destination) return "";
    return `${formState.origin.code}-${formState.destination.code}`;
  }, [formState.destination, formState.origin]);

  const affiliateSearchUrl = useMemo(
    () => buildAffiliateSearchUrl(formState, locale),
    [formState, locale]
  );

  const runSearch = useCallback(async () => {
    if (!formState.origin || !formState.destination || !formState.departDate) {
      setError(t("flights.errors.missingFields"));
      return;
    }

    if (formState.tripType === "round_trip" && !formState.returnDate) {
      setError(t("flights.errors.missingReturn"));
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const params = new URLSearchParams({
        origin: formState.origin.code,
        destination: formState.destination.code,
        departDate: formState.departDate,
        tripType: formState.tripType,
        locale,
        currency,
      });

      if (formState.tripType === "round_trip" && formState.returnDate) {
        params.set("returnDate", formState.returnDate);
      }

      const response = await fetch(`/api/flights/prices?${params}`);
      const payload = (await response.json()) as {
        offers?: FlightPriceOffer[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || t("flights.errors.loadFailed"));
      }

      setOffers(payload.offers ?? []);
    } catch (searchError) {
      setOffers([]);
      setError(searchError instanceof Error ? searchError.message : t("flights.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [currency, formState, locale, t]);

  function handlePopularRoute(origin: string, destination: string) {
    setFormState((prev) => ({
      ...prev,
      origin: placeFromCode(origin),
      destination: placeFromCode(destination),
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const formLabels = {
    origin: t("flights.form.origin"),
    destination: t("flights.form.destination"),
    originPlaceholder: t("flights.form.originPlaceholder"),
    destinationPlaceholder: t("flights.form.destinationPlaceholder"),
    departDate: t("flights.form.departDate"),
    returnDate: t("flights.form.returnDate"),
    oneWay: t("flights.form.oneWay"),
    roundTrip: t("flights.form.roundTrip"),
    adults: t("flights.form.adults"),
    children: t("flights.form.children"),
    infants: t("flights.form.infants"),
    search: t("flights.form.search"),
    searching: t("flights.form.searching"),
    swap: t("flights.form.swap"),
  };

  const offerLabels = {
    book: t("flights.offer.book"),
    direct: t("flights.offer.direct"),
    stops: t("flights.offer.stops"),
    departure: t("flights.offer.departure"),
    return: t("flights.offer.return"),
  };

  return (
    <>
      <Hero
        eyebrow={t("flights.eyebrow")}
        title={t("flights.title")}
        subtitle={t("flights.subtitle")}
        description={t("flights.intro")}
        image="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80"
        compact
      >
        <FlightSearchForm
          state={formState}
          onChange={setFormState}
          onSubmit={() => void runSearch()}
          loading={loading}
          locale={locale}
          labels={formLabels}
        />
      </Hero>

      <section className={siteContainerClass + " py-10 sm:py-14"}>
        <FlightPopularRoutes
          title={t("flights.popular.title")}
          onSelect={handlePopularRoute}
        />

        {error ? (
          <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {searched ? (
          <div className="mt-12 space-y-4 border-t border-gray-100 pt-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-sky" />
                <h2 className="font-heading text-xl font-bold text-charcoal">
                  {loading ? t("flights.results.loading") : t("flights.results.title")}
                </h2>
              </div>

              {affiliateSearchUrl ? (
                <a
                  href={affiliateSearchUrl}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "rounded-full border-sky/30 text-sky hover:bg-sky/5"
                  )}
                >
                  {t("flights.results.openAviasales")}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              ) : null}
            </div>

            {!loading && offers.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-slate">
                <p>{t("flights.results.empty")}</p>
                {affiliateSearchUrl ? (
                  <a href={affiliateSearchUrl} className="mt-4 inline-flex text-sky hover:underline">
                    {t("flights.results.emptyCta")}
                  </a>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-4">
              {offers.map((offer) => (
                <FlightOfferCard
                  key={offer.id}
                  offer={offer}
                  locale={locale}
                  routeKey={routeKey}
                  labels={offerLabels}
                />
              ))}
            </div>

            <p className="text-xs leading-relaxed text-slate">{t("flights.disclaimer")}</p>
          </div>
        ) : null}
      </section>
    </>
  );
}
