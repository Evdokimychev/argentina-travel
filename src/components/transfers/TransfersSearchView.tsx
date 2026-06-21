"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Car, ExternalLink } from "lucide-react";
import Hero from "@/components/Hero";
import TransferOfferCard from "@/components/transfers/TransferOfferCard";
import TransferPopularRoutes from "@/components/transfers/TransferPopularRoutes";
import TransferSearchForm, {
  type TransferSearchFormState,
} from "@/components/transfers/TransferSearchForm";
import { buttonVariants } from "@/components/ui/button";
import { getTransferLocationById } from "@/data/transfer-locations";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { getServicePageHeroImage } from "@/lib/media-resolver";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/utils";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { normalizeSiteError, siteFormError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";
import type { TransferLocation, TransferOffer } from "@/lib/intui/types";

function defaultPickupDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
}

function appendLocationParams(params: URLSearchParams, prefix: string, location: TransferLocation): void {
  params.set(`${prefix}Id`, location.id);
  params.set(`${prefix}Type`, location.type);
  params.set(`${prefix}Name`, location.name);
  if (location.code) params.set(`${prefix}Code`, location.code);
  if (location.lat != null) params.set(`${prefix}Lat`, String(location.lat));
  if (location.lng != null) params.set(`${prefix}Lng`, String(location.lng));
}

function buildSearchParams(state: TransferSearchFormState, locale: string, currency: string): URLSearchParams {
  const params = new URLSearchParams({
    date: state.date,
    time: state.time,
    adults: String(state.adults),
    children: String(state.children),
    infants: String(state.infants),
    locale,
    currency,
  });

  if (state.origin) appendLocationParams(params, "origin", state.origin);
  if (state.destination) appendLocationParams(params, "destination", state.destination);

  return params;
}

function buildAffiliateSearchUrl(state: TransferSearchFormState, locale: string, currency: string): string {
  if (!state.origin || !state.destination || !state.date) return "";
  return `/api/affiliate/transfers/search?${buildSearchParams(state, locale, currency)}`;
}

function buildRouteKey(origin: TransferLocation, destination: TransferLocation): string {
  return `${origin.code ?? origin.id}-${destination.code ?? destination.id}`;
}

export default function TransfersSearchView() {
  const searchParams = useSearchParams();
  const { t, locale, currency } = useLocaleCurrency();
  const [formState, setFormState] = useState<TransferSearchFormState>(() => ({
    origin: null,
    destination: null,
    date: defaultPickupDate(),
    time: "12:00",
    adults: 2,
    children: 0,
    infants: 0,
  }));
  const [offers, setOffers] = useState<TransferOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setErrorState] = useState<SiteFeedbackMessage | null>(null);
  const [searched, setSearched] = useState(false);

  const setError = (value: string | SiteFeedbackMessage | null) => {
    if (value === null) {
      setErrorState(null);
      return;
    }
    setErrorState(typeof value === "string" ? siteFormError(value) : value);
  };
  const [source, setSource] = useState<string | null>(null);
  const [affiliateFallbackUrl, setAffiliateFallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    const originId = searchParams.get("from") ?? searchParams.get("origin");
    const destinationId = searchParams.get("to") ?? searchParams.get("destination");
    if (!originId && !destinationId) return;

    setFormState((prev) => ({
      ...prev,
      origin: originId ? getTransferLocationById(originId) ?? prev.origin : prev.origin,
      destination: destinationId
        ? getTransferLocationById(destinationId) ?? prev.destination
        : prev.destination,
    }));
  }, [searchParams]);

  const routeKey = useMemo(() => {
    if (!formState.origin || !formState.destination) return "";
    return buildRouteKey(formState.origin, formState.destination);
  }, [formState.destination, formState.origin]);

  const affiliateSearchUrl = useMemo(
    () => buildAffiliateSearchUrl(formState, locale, currency),
    [formState, locale, currency]
  );

  const runSearch = useCallback(async () => {
    if (!formState.origin || !formState.destination || !formState.date) {
      setError(t("transfers.errors.missingFields"));
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);
    setAffiliateFallbackUrl(null);

    try {
      const params = buildSearchParams(formState, locale, currency);
      const response = await fetch(`/api/transfers/search?${params}`);
      const payload = (await response.json()) as {
        offers?: TransferOffer[];
        source?: string;
        error?: string;
        affiliateUrl?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || t("transfers.errors.loadFailed"));
      }

      setOffers(payload.offers ?? []);
      setSource(payload.source ?? null);

      if (payload.source === "unconfigured" && payload.affiliateUrl) {
        setAffiliateFallbackUrl(payload.affiliateUrl);
      } else {
        setAffiliateFallbackUrl(null);
      }

      if (payload.error) {
        setError(
          siteFormError(payload.error, {
            title: "Поиск трансферов",
            steps: ["Измените дату или маршрут", "Попробуйте поиск на партнёрской странице"],
          })
        );
      }
    } catch (searchError) {
      setOffers([]);
      setSource(null);
      setAffiliateFallbackUrl(null);
      setError(
        normalizeSiteError(searchError, {
          title: "Не удалось найти трансферы",
          steps: ["Проверьте пункт отправления и назначения", "Выберите другую дату"],
        })
      );
    } finally {
      setLoading(false);
    }
  }, [currency, formState, locale, t]);

  function handlePopularRoute(origin: TransferLocation, destination: TransferLocation) {
    setFormState((prev) => ({
      ...prev,
      origin,
      destination,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const formLabels = {
    origin: t("transfers.form.origin"),
    destination: t("transfers.form.destination"),
    originPlaceholder: t("transfers.form.originPlaceholder"),
    destinationPlaceholder: t("transfers.form.destinationPlaceholder"),
    date: t("transfers.form.date"),
    time: t("transfers.form.time"),
    adults: t("transfers.form.adults"),
    children: t("transfers.form.children"),
    infants: t("transfers.form.infants"),
    search: t("transfers.form.search"),
    searching: t("transfers.form.searching"),
    swap: t("transfers.form.swap"),
  };

  const offerLabels = {
    book: t("transfers.offer.book"),
    capacity: t("transfers.offer.capacity"),
    luggage: t("transfers.offer.luggage"),
    duration: t("transfers.offer.duration"),
    features: t("transfers.offer.features"),
  };

  return (
    <>
      <Hero
        eyebrow={t("transfers.eyebrow")}
        title={t("transfers.title")}
        subtitle={t("transfers.subtitle")}
        description={t("transfers.intro")}
        image={getServicePageHeroImage("transfers")}
        compact
      >
        <TransferSearchForm
          state={formState}
          onChange={setFormState}
          onSubmit={() => void runSearch()}
          loading={loading}
          locale={locale}
          labels={formLabels}
        />
      </Hero>

      <section className={siteContainerClass + " py-10 sm:py-14"}>
        <TransferPopularRoutes
          title={t("transfers.popular.title")}
          onSelect={handlePopularRoute}
        />

        {error ? (
          <InlineFeedback
            variant="error"
            title={error.title}
            description={error.description}
            steps={error.steps}
            action={error.action}
            className="mt-8"
          />
        ) : null}

        {searched ? (
          <div className="mt-12 space-y-4 border-t border-gray-100 pt-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-sky" />
                <h2 className="font-heading text-xl font-bold text-charcoal">
                  {loading ? t("transfers.results.loading") : t("transfers.results.title")}
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
                  {t("transfers.results.openIntui")}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              ) : null}
            </div>

            {!loading && offers.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-slate">
                <p>
                  {source === "unconfigured"
                    ? t("transfers.results.unconfigured")
                    : t("transfers.results.empty")}
                </p>
                {(affiliateFallbackUrl || affiliateSearchUrl) ? (
                  <a
                    href={affiliateFallbackUrl ?? affiliateSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "mt-4 inline-flex rounded-full px-6"
                    )}
                  >
                    {t("transfers.results.emptyCta")}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-4">
              {offers.map((offer) => (
                <TransferOfferCard
                  key={offer.id}
                  offer={offer}
                  locale={locale}
                  routeKey={routeKey}
                  labels={offerLabels}
                />
              ))}
            </div>

            <p className="text-xs leading-relaxed text-slate">{t("transfers.disclaimer")}</p>
          </div>
        ) : null}
      </section>
    </>
  );
}
