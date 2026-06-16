"use client";

import { useSearchParams } from "next/navigation";
import { Shield } from "lucide-react";
import Hero from "@/components/Hero";
import InsuranceBenefits from "@/components/insurance/InsuranceBenefits";
import InsuranceWhitelabelWidget from "@/components/insurance/InsuranceWhitelabelWidget";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { formatTourists } from "@/lib/pluralize";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/utils";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80";

export default function InsuranceView({ scriptUrl }: { scriptUrl: string }) {
  const searchParams = useSearchParams();
  const { t } = useLocaleCurrency();
  const travelersParam = Number.parseInt(searchParams.get("travelers") ?? "", 10);
  const travelers =
    Number.isFinite(travelersParam) && travelersParam > 0 ? travelersParam : null;

  return (
    <div className="insurance-page-root w-full">
      <Hero
        eyebrow={t("insurance.eyebrow")}
        title={t("insurance.title")}
        subtitle={t("insurance.subtitle")}
        description={t("insurance.description")}
        image={HERO_IMAGE}
        compact
        ctaText={t("insurance.heroCta")}
        ctaHref="#insurance-widget"
      />

      <section className={cn(siteContainerClass, "py-10 sm:py-14")}>
        <div id="insurance-widget" className="scroll-mt-24">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-sky" aria-hidden />
            <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
              {t("insurance.widgetTitle")}
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">
            {t("insurance.partnerNote")}
          </p>
          {travelers ? (
            <p className="mt-3 rounded-xl border border-sky/20 bg-sky/5 px-4 py-3 text-sm text-charcoal">
              {t("insurance.checkoutHint").replace("{count}", formatTourists(travelers))}
            </p>
          ) : null}
          <div className="mt-6">
            <InsuranceWhitelabelWidget
              scriptUrl={scriptUrl}
              loadingLabel={t("insurance.widgetLoading")}
            />
          </div>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-slate">{t("insurance.disclaimer")}</p>
      </section>

      <InsuranceBenefits
        title={t("insurance.benefits.title")}
        items={[
          t("insurance.benefits.item1"),
          t("insurance.benefits.item2"),
          t("insurance.benefits.item3"),
          t("insurance.benefits.item4"),
        ]}
        className="border-t border-gray-100 bg-surface-muted/40"
      />
    </div>
  );
}
