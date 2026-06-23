"use client";

import Link from "next/link";
import CarRentalBenefits from "@/components/car-rental/CarRentalBenefits";
import CarRentalFaqSection from "@/components/car-rental/CarRentalFaqSection";
import LocalRentWidget from "@/components/car-rental/LocalRentWidget";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/utils";
import "./car-rental-page.css";

export default function CarRentalView() {
  const { t } = useLocaleCurrency();

  const regionItems = [
    { title: t("carRental.regions.mendoza.title"), description: t("carRental.regions.mendoza.description") },
    { title: t("carRental.regions.patagonia.title"), description: t("carRental.regions.patagonia.description") },
    { title: t("carRental.regions.salta.title"), description: t("carRental.regions.salta.description") },
  ];

  return (
    <div className="car-rental-page-root w-full">
      <header className="car-rental-page-hero" data-scroll-rail-tone="light">
        <div className="car-rental-page-hero__glow car-rental-page-hero__glow--primary" aria-hidden />
        <div className="car-rental-page-hero__glow car-rental-page-hero__glow--secondary" aria-hidden />
        <div className={cn(siteContainerClass, "relative pt-10 pb-9 md:pt-12 sm:pb-10 lg:pt-14 lg:pb-12")}>
          <h1 className="max-w-2xl font-display text-[1.75rem] font-bold leading-tight tracking-tight text-charcoal sm:text-4xl lg:text-[2.35rem]">
            {t("carRental.page.title")}
          </h1>
          <p className="mt-2.5 max-w-xl text-base leading-relaxed text-slate/90 sm:text-[1.05rem]">
            {t("carRental.page.tagline")}
          </p>
        </div>
      </header>

      <div className={cn(siteContainerClass, "relative pb-14 sm:pb-16 lg:pb-20")}>
        <div
          id="car-rental-search"
          className="car-rental-page-search-shell scroll-mt-[calc(var(--site-header-height,72px)+1rem)]"
        >
          <LocalRentWidget loadingLabel={t("carRental.widgetLoading")} />
        </div>

        <footer className="mt-10 border-t border-gray-100 pt-8 sm:mt-12 sm:pt-10">
          <p className="max-w-3xl text-sm leading-relaxed text-slate">
            {t("carRental.intro")}{" "}
            <Link href="/guide/kak-dobratsya" className="font-medium text-sky hover:underline">
              {t("carRental.introGuideLink")}
            </Link>
            .
          </p>

          <CarRentalBenefits
            title={t("carRental.benefits.title")}
            items={[
              t("carRental.benefits.item1"),
              t("carRental.benefits.item2"),
              t("carRental.benefits.item3"),
              t("carRental.benefits.item4"),
            ]}
          />

          <section
            aria-labelledby="car-rental-regions-title"
            className="mt-12 rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_24px_rgba(26,26,46,0.06)] sm:p-8"
          >
            <h2
              id="car-rental-regions-title"
              className="font-heading text-xl font-bold text-charcoal sm:text-2xl"
            >
              {t("carRental.regions.title")}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate">
              {t("carRental.regions.intro")}{" "}
              <Link href="/guide/transport" className="font-medium text-sky hover:underline">
                {t("carRental.regions.transportLink")}
              </Link>
              .
            </p>

            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              {regionItems.map((region) => (
                <li
                  key={region.title}
                  className="rounded-2xl border border-gray-100 bg-surface-muted/30 p-5"
                >
                  <h3 className="font-heading font-bold text-charcoal">{region.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate">{region.description}</p>
                </li>
              ))}
            </ul>
          </section>

          <CarRentalFaqSection
            title={t("carRental.faq.title")}
            items={[
              { question: t("carRental.faq.q1"), answer: t("carRental.faq.a1") },
              { question: t("carRental.faq.q2"), answer: t("carRental.faq.a2") },
              { question: t("carRental.faq.q3"), answer: t("carRental.faq.a3") },
              { question: t("carRental.faq.q4"), answer: t("carRental.faq.a4") },
            ]}
          />

          <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-slate/75">
            {t("carRental.page.disclaimer")}
          </p>
        </footer>
      </div>
    </div>
  );
}
