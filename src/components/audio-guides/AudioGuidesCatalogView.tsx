"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Headphones, Search } from "lucide-react";
import Hero from "@/components/Hero";
import AudioGuideBenefits from "@/components/audio-guides/AudioGuideBenefits";
import AudioGuideCard from "@/components/audio-guides/AudioGuideCard";
import { DEFAULT_WEGOTTRIP_CITY_ID, WEGOTTRIP_FEATURED_CITIES } from "@/lib/wegottrip/constants";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/utils";
import type { WeGoTripProductSummary } from "@/lib/wegottrip/types";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1520986750442-3f7a5444e4f7?w=1200&q=80";

export default function AudioGuidesCatalogView() {
  const searchParams = useSearchParams();
  const { t, locale, currency } = useLocaleCurrency();
  const [cityId, setCityId] = useState<number>(DEFAULT_WEGOTTRIP_CITY_ID);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<WeGoTripProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    const param = searchParams.get("city")?.trim();
    if (param) {
      const featured = WEGOTTRIP_FEATURED_CITIES.find((city) => city.id === param);
      if (featured) setCityId(featured.wegoCityId);
      else {
        const numeric = Number.parseInt(param, 10);
        if (Number.isFinite(numeric)) setCityId(numeric);
      }
    }
  }, [searchParams]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        locale,
        currency,
        city: String(cityId),
      });
      const response = await fetch(`/api/audio-guides/products?${params}`);
      const payload = (await response.json()) as {
        products?: WeGoTripProductSummary[];
        source?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || t("audioGuides.errors.loadFailed"));
      }

      setProducts(payload.products ?? []);
      setSource(payload.source ?? null);
    } catch (loadError) {
      setProducts([]);
      setSource(null);
      setError(loadError instanceof Error ? loadError.message : t("audioGuides.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [cityId, currency, locale, t]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const runSearch = useCallback(async () => {
    const term = query.trim();
    if (term.length < 3) {
      void loadProducts();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ q: term, locale, currency });
      const response = await fetch(`/api/audio-guides/search?${params}`);
      const payload = (await response.json()) as {
        results?: Array<{ type: string } & WeGoTripProductSummary>;
      };

      if (!response.ok) throw new Error(t("audioGuides.errors.searchFailed"));

      const found = (payload.results ?? [])
        .filter((item) => item.type === "product")
        .map((item) => item as WeGoTripProductSummary);
      setProducts(found);
      setSource(found.length > 0 ? "search" : "fallback");
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : t("audioGuides.errors.searchFailed"));
    } finally {
      setLoading(false);
    }
  }, [currency, loadProducts, locale, query, t]);

  return (
    <>
      <Hero
        eyebrow={t("audioGuides.eyebrow")}
        title={t("audioGuides.title")}
        subtitle={t("audioGuides.subtitle")}
        description={t("audioGuides.description")}
        image={HERO_IMAGE}
        compact
        ctaText={t("audioGuides.heroCta")}
        ctaHref="#audio-guides-catalog"
      />

      <section id="audio-guides-catalog" className={cn(siteContainerClass, "scroll-mt-24 py-10 sm:py-14")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-sky" aria-hidden />
              <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
                {t("audioGuides.catalogTitle")}
              </h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">
              {t("audioGuides.partnerNote")}
            </p>
          </div>

          <form
            className="flex w-full max-w-md gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void runSearch();
            }}
          >
            <label className="sr-only" htmlFor="audio-guide-search">
              {t("audioGuides.searchPlaceholder")}
            </label>
            <input
              id="audio-guide-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("audioGuides.searchPlaceholder")}
              className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-charcoal px-4 py-2.5 text-sm font-semibold text-white hover:bg-charcoal/90"
            >
              <Search className="h-4 w-4" aria-hidden />
              {t("audioGuides.search")}
            </button>
          </form>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {WEGOTTRIP_FEATURED_CITIES.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => {
                setQuery("");
                setCityId(city.wegoCityId);
              }}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                cityId === city.wegoCityId
                  ? "bg-sky text-white"
                  : "border border-gray-200 text-charcoal hover:border-sky/30 hover:text-sky"
              )}
            >
              {t(city.nameKey)}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-10 text-sm text-slate">{t("audioGuides.loading")}</p>
        ) : products.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-6 text-sm text-slate">
            <p>{t("audioGuides.empty")}</p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <li key={product.id}>
                <AudioGuideCard
                  product={product}
                  bookLabel={t("audioGuides.book")}
                  fromLabel={t("audioGuides.fromPrice")}
                />
              </li>
            ))}
          </ul>
        )}

        {source === "fallback" && products.length === 0 ? null : (
          <p className="mt-8 text-xs leading-relaxed text-slate">{t("audioGuides.disclaimer")}</p>
        )}

        <AudioGuideBenefits
          title={t("audioGuides.benefits.title")}
          items={[
            t("audioGuides.benefits.item1"),
            t("audioGuides.benefits.item2"),
            t("audioGuides.benefits.item3"),
            t("audioGuides.benefits.item4"),
          ]}
        />
      </section>
    </>
  );
}
