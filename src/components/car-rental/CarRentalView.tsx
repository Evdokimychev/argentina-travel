"use client";

import Link from "next/link";
import { Car } from "lucide-react";
import Hero from "@/components/Hero";
import CarRentalBenefits from "@/components/car-rental/CarRentalBenefits";
import CarRentalFaqSection from "@/components/car-rental/CarRentalFaqSection";
import LocalRentWidget from "@/components/car-rental/LocalRentWidget";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { getServicePageHeroImage } from "@/lib/media-resolver";
import { siteContainerClass } from "@/lib/site-container";

const HERO_IMAGE = getServicePageHeroImage("car-rental");

export default function CarRentalView() {
  const { t } = useLocaleCurrency();

  const regionItems = [
    { title: t("carRental.regions.mendoza.title"), description: t("carRental.regions.mendoza.description") },
    { title: t("carRental.regions.patagonia.title"), description: t("carRental.regions.patagonia.description") },
    { title: t("carRental.regions.salta.title"), description: t("carRental.regions.salta.description") },
  ];

  return (
    <>
      <Hero
        eyebrow={t("carRental.eyebrow")}
        title={t("carRental.title")}
        subtitle={t("carRental.subtitle")}
        description={t("carRental.description")}
        image={HERO_IMAGE}
        compact
        ctaText={t("carRental.heroCta")}
        ctaHref="#car-rental-booking"
      />

      <section className={siteContainerClass + " py-10 sm:py-14"}>
        <div id="car-rental-booking" className="scroll-mt-24">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-sky" aria-hidden />
            <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
              {t("carRental.widgetTitle")}
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">
            {t("carRental.partnerNote")}
          </p>
          <LocalRentWidget loadingLabel={t("carRental.widgetLoading")} className="mt-6" />
        </div>

        <p className="mt-10 max-w-3xl text-sm leading-relaxed text-slate">
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

        <p className="mt-10 text-xs leading-relaxed text-slate">{t("carRental.disclaimer")}</p>
      </section>
    </>
  );
}
