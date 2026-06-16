"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, MapPin, Star } from "lucide-react";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { siteContainerClass } from "@/lib/site-container";
import type { WeGoTripProductDetail } from "@/lib/wegottrip/types";

type AudioGuideDetailViewProps = {
  productId: number;
};

function formatPrice(product: WeGoTripProductDetail): string {
  const amount = Number.isInteger(product.price) ? String(product.price) : product.price.toFixed(2);
  return `${product.currencySymbol}${amount}`;
}

export default function AudioGuideDetailView({ productId }: AudioGuideDetailViewProps) {
  const { t, locale, currency } = useLocaleCurrency();
  const [product, setProduct] = useState<WeGoTripProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ locale, currency });
        const response = await fetch(`/api/audio-guides/products/${productId}?${params}`);
        const payload = (await response.json()) as { product?: WeGoTripProductDetail; error?: string };
        if (!response.ok) throw new Error(payload.error || t("audioGuides.errors.loadFailed"));
        setProduct(payload.product ?? null);
      } catch (loadError) {
        setProduct(null);
        setError(loadError instanceof Error ? loadError.message : t("audioGuides.errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [currency, locale, productId, t]);

  const bookHref = `/api/affiliate/audio-guides/book?productId=${productId}&checkout=1&locale=${locale}&currency=${currency}`;
  const infoHref = `/api/affiliate/audio-guides/book?productId=${productId}&locale=${locale}&currency=${currency}`;

  return (
    <div className={siteContainerClass + " py-8 sm:py-12"}>
      <Link
        href="/audio-guides"
        className="inline-flex items-center gap-2 text-sm font-medium text-sky hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("audioGuides.backToCatalog")}
      </Link>

      {loading ? <p className="mt-8 text-sm text-slate">{t("audioGuides.loading")}</p> : null}
      {error ? (
        <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {product ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-surface-muted">
              {product.preview ? (
                <Image src={product.preview} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 66vw" />
              ) : null}
            </div>

            <h1 className="mt-6 font-heading text-2xl font-bold text-charcoal sm:text-3xl">{product.title}</h1>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate">
              {product.city.name ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {product.city.name}
                </span>
              ) : null}
              {product.duration ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" aria-hidden />
                  {product.duration}
                </span>
              ) : null}
              {product.rating != null && product.reviewsCount > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-sun text-sun" aria-hidden />
                  {product.rating.toFixed(1)} ({product.reviewsCount})
                </span>
              ) : null}
            </div>

            {product.description ? (
              <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-slate">
                {product.description}
              </div>
            ) : null}

            {product.highlights.length > 0 ? (
              <section className="mt-8">
                <h2 className="font-heading text-lg font-bold text-charcoal">{t("audioGuides.highlights")}</h2>
                <ul className="mt-3 space-y-2 text-sm text-slate">
                  {product.highlights.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {product.exclusions.length > 0 ? (
              <section className="mt-8">
                <h2 className="font-heading text-lg font-bold text-charcoal">{t("audioGuides.exclusions")}</h2>
                <ul className="mt-3 space-y-2 text-sm text-slate">
                  {product.exclusions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card lg:sticky lg:top-28">
            <p className="text-xs uppercase tracking-wide text-slate">{t("audioGuides.fromPrice")}</p>
            <p className="mt-1 font-heading text-3xl font-bold text-charcoal">{formatPrice(product)}</p>
            {product.startLocation ? (
              <p className="mt-4 text-sm text-slate">
                <span className="font-medium text-charcoal">{t("audioGuides.start")}: </span>
                {product.startLocation}
              </p>
            ) : null}
            {product.finishLocation ? (
              <p className="mt-2 text-sm text-slate">
                <span className="font-medium text-charcoal">{t("audioGuides.finish")}: </span>
                {product.finishLocation}
              </p>
            ) : null}
            <a
              href={bookHref}
              className="mt-6 flex w-full items-center justify-center rounded-full bg-sky px-6 py-3 text-sm font-semibold text-white hover:bg-sky-dark"
            >
              {t("audioGuides.book")}
            </a>
            <a href={infoHref} className="mt-3 block text-center text-sm font-medium text-sky hover:underline">
              {t("audioGuides.viewOnPartner")}
            </a>
            <p className="mt-4 text-xs leading-relaxed text-slate">{t("audioGuides.disclaimer")}</p>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
