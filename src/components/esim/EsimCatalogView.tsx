"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Smartphone } from "lucide-react";
import Hero from "@/components/Hero";
import EsimCatalogFilters from "@/components/esim/EsimCatalogFilters";
import EsimCatalogStats from "@/components/esim/EsimCatalogStats";
import EsimCountryPicker from "@/components/esim/EsimCountryPicker";
import EsimHowItWorks from "@/components/esim/EsimHowItWorks";
import EsimWhyAiralo from "@/components/esim/EsimWhyAiralo";
import EsimFaqSection from "@/components/esim/EsimFaqSection";
import EsimOfferCard from "@/components/esim/EsimOfferCard";
import { buttonVariants } from "@/components/ui/button";
import { DEFAULT_ESIM_COUNTRY_ID } from "@/data/esim-countries";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { buildEsimFilterOptions, filterEsimOffers, sortEsimOffers } from "@/lib/airalo/offer-meta";
import {
  AIRALO_WHATSAPP_SUPPORT_URL,
  resolveAiraloHelpCenterUrl,
} from "@/lib/airalo/locale-url";
import type { EsimOfferFilters } from "@/lib/airalo/offer-meta";
import { getServicePageHeroImage } from "@/lib/media-resolver";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/utils";
import type { EsimCatalogSummary, EsimOffer } from "@/lib/airalo/types";

type EsimSortOption = "price_asc" | "price_desc" | "data_desc" | "validity_desc" | "price_per_day";

export default function EsimCatalogView() {
  const searchParams = useSearchParams();
  const { t, locale } = useLocaleCurrency();
  const [countryId, setCountryId] = useState(DEFAULT_ESIM_COUNTRY_ID);
  const [offers, setOffers] = useState<EsimOffer[]>([]);
  const [summary, setSummary] = useState<EsimCatalogSummary | null>(null);
  const [sort, setSort] = useState<EsimSortOption>("price_asc");
  const [filters, setFilters] = useState<EsimOfferFilters>({ dataType: "all" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [countryAffiliateUrl, setCountryAffiliateUrl] = useState<string | null>(null);
  const [partnerHomeUrl, setPartnerHomeUrl] = useState<string | null>(null);

  useEffect(() => {
    const param = searchParams.get("country")?.trim();
    if (param) setCountryId(param);
  }, [searchParams]);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ country: countryId, limit: "500", locale });
      const response = await fetch(`/api/esim/offers?${params}`);
      const payload = (await response.json()) as {
        offers?: EsimOffer[];
        summary?: EsimCatalogSummary;
        source?: string;
        error?: string;
        countryAffiliateUrl?: string;
        partnerHomeUrl?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || t("esim.errors.loadFailed"));
      }

      setOffers(payload.offers ?? []);
      setSummary(payload.summary ?? null);
      setSource(payload.source ?? null);
      setCountryAffiliateUrl(payload.countryAffiliateUrl ?? null);
      setPartnerHomeUrl(payload.partnerHomeUrl ?? null);

      if (payload.error) {
        setError(payload.error);
      }
    } catch (loadError) {
      setOffers([]);
      setSummary(null);
      setSource(null);
      setCountryAffiliateUrl(null);
      setPartnerHomeUrl(null);
      setError(loadError instanceof Error ? loadError.message : t("esim.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [countryId, locale, t]);

  useEffect(() => {
    void loadOffers();
  }, [loadOffers]);

  useEffect(() => {
    setFilters({ dataType: "all" });
  }, [countryId]);

  const filterOptions = useMemo(() => buildEsimFilterOptions(offers), [offers]);
  const filteredOffers = useMemo(() => filterEsimOffers(offers, filters), [offers, filters]);
  const sortedOffers = useMemo(() => sortEsimOffers(filteredOffers, sort), [filteredOffers, sort]);

  const offerLabels = {
    buy: t("esim.offer.buy"),
    buyHint: t("esim.offer.buyHint"),
    from: t("esim.offer.from"),
    data: t("esim.offer.data"),
    validity: t("esim.offer.validity"),
    network: t("esim.offer.network"),
    pricePerDay: t("esim.offer.pricePerDay"),
    planType: t("esim.offer.planType"),
    inStock: t("esim.offer.inStock"),
    unlimited: t("esim.offer.unlimited"),
    days: t("esim.offer.days"),
  };

  const filterLabels = {
    dataType: t("esim.filters.dataType"),
    all: t("esim.filters.all"),
    unlimited: t("esim.offer.unlimited"),
    limited: t("esim.filters.limited"),
    dataVolume: t("esim.filters.dataVolume"),
    validity: t("esim.filters.validity"),
    planType: t("esim.offer.planType"),
    days: t("esim.offer.days"),
    reset: t("esim.filters.reset"),
  };

  const statsLabels = {
    packages: t("esim.stats.packages"),
    fromPrice: t("esim.stats.fromPrice"),
    dataRange: t("esim.stats.dataRange"),
    validityRange: t("esim.stats.validityRange"),
    networks: t("esim.stats.networks"),
    unlimited: t("esim.offer.unlimited"),
    days: t("esim.offer.days"),
  };

  const fallbackUrl =
    countryAffiliateUrl ??
    partnerHomeUrl ??
    `/api/affiliate/esim/book?${new URLSearchParams({ country: countryId, locale })}`;
  const homeUrl = partnerHomeUrl ?? fallbackUrl;

  return (
    <>
      <Hero
        eyebrow={t("esim.eyebrow")}
        title={t("esim.title")}
        subtitle={t("esim.subtitle")}
        description={t("esim.intro")}
        image={getServicePageHeroImage("esim")}
        compact
      />

      <section className={siteContainerClass + " py-10 sm:py-14"}>
        <EsimHowItWorks
          title={t("esim.howItWorks.title")}
          steps={[
            {
              title: t("esim.howItWorks.step1.title"),
              description: t("esim.howItWorks.step1.description"),
            },
            {
              title: t("esim.howItWorks.step2.title"),
              description: t("esim.howItWorks.step2.description"),
            },
            {
              title: t("esim.howItWorks.step3.title"),
              description: t("esim.howItWorks.step3.description"),
            },
          ]}
        />

        <EsimCountryPicker value={countryId} onChange={setCountryId} className="mt-8" />

        {summary && !loading ? <EsimCatalogStats summary={summary} labels={statsLabels} /> : null}

        {!loading && summary && !summary.hasUnlimited && offers.length > 0 ? (
          <p className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t("esim.results.noUnlimitedHint")}
          </p>
        ) : null}

        {!loading && offers.length > 0 ? (
          <EsimCatalogFilters
            className="mt-6"
            filters={filters}
            options={filterOptions}
            onChange={setFilters}
            labels={filterLabels}
          />
        ) : null}

        {error ? (
          <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-10 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-sky" />
              <h2 className="font-heading text-xl font-bold text-charcoal">
                {loading ? t("esim.results.loading") : t("esim.results.title")}
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {!loading && offers.length > 0 ? (
                <label className="flex items-center gap-2 text-sm text-slate">
                  <span className="whitespace-nowrap">{t("esim.sortLabel")}</span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as EsimSortOption)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-charcoal outline-none focus:border-sky focus:ring-2 focus:ring-sky/30"
                  >
                    <option value="price_asc">{t("esim.sort.priceAsc")}</option>
                    <option value="price_desc">{t("esim.sort.priceDesc")}</option>
                    <option value="data_desc">{t("esim.sort.dataDesc")}</option>
                    <option value="validity_desc">{t("esim.sort.validityDesc")}</option>
                    <option value="price_per_day">{t("esim.sort.pricePerDay")}</option>
                  </select>
                </label>
              ) : null}

              {homeUrl ? (
                <a
                  href={homeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "rounded-full border-sky/30 text-sky hover:bg-sky/5"
                  )}
                >
                  {t("esim.results.openAiralo")}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>

          {!loading && offers.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-slate">
              <p>
                {source === "unconfigured"
                  ? t("esim.results.unconfigured")
                  : t("esim.results.empty")}
              </p>
              {fallbackUrl ? (
                <a
                  href={fallbackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "mt-4 inline-flex rounded-full px-6"
                  )}
                >
                  {t("esim.results.emptyCta")}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              ) : null}
            </div>
          ) : null}

          {!loading && offers.length > 0 && filteredOffers.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-slate">
              <p>{t("esim.results.filteredEmpty")}</p>
              <button
                type="button"
                onClick={() => setFilters({ dataType: "all" })}
                className="mt-3 text-sm font-medium text-sky hover:underline"
              >
                {t("esim.filters.reset")}
              </button>
            </div>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {sortedOffers.map((offer) => (
              <EsimOfferCard
                key={offer.id}
                offer={offer}
                countryId={countryId}
                locale={locale}
                labels={offerLabels}
              />
            ))}
          </div>

          <EsimWhyAiralo
            title={t("esim.why.title")}
            items={[
              t("esim.why.item1"),
              t("esim.why.item2"),
              t("esim.why.item3"),
              t("esim.why.item4"),
            ]}
          />

          <EsimFaqSection
            title={t("esim.faq.title")}
            helpCenterLabel={t("esim.faq.helpCenter")}
            helpCenterUrl={resolveAiraloHelpCenterUrl(locale)}
            items={[
              { question: t("esim.faq.q1"), answer: t("esim.faq.a1") },
              { question: t("esim.faq.q2"), answer: t("esim.faq.a2") },
              { question: t("esim.faq.q3"), answer: t("esim.faq.a3") },
              { question: t("esim.faq.q4"), answer: t("esim.faq.a4") },
            ]}
            support={{
              title: t("esim.faq.support.title"),
              description: t("esim.faq.support.description"),
              whatsappLabel: t("esim.faq.support.whatsapp"),
              whatsappUrl: AIRALO_WHATSAPP_SUPPORT_URL,
            }}
          />

          <p className="text-xs leading-relaxed text-slate">{t("esim.disclaimer")}</p>
        </div>
      </section>
    </>
  );
}
