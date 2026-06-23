"use client";

import { useSearchParams } from "next/navigation";
import InsuranceBenefits from "@/components/insurance/InsuranceBenefits";
import InsuranceWhitelabelWidget from "@/components/insurance/InsuranceWhitelabelWidget";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { formatTourists } from "@/lib/pluralize";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/utils";
import "./insurance-page.css";

export default function InsuranceView({ scriptUrl }: { scriptUrl: string }) {
  const searchParams = useSearchParams();
  const { t } = useLocaleCurrency();
  const travelersParam = Number.parseInt(searchParams.get("travelers") ?? "", 10);
  const travelers =
    Number.isFinite(travelersParam) && travelersParam > 0 ? travelersParam : null;

  return (
    <div className="insurance-page-root w-full">
      <header className="insurance-page-hero" data-scroll-rail-tone="light">
        <div className="insurance-page-hero__glow insurance-page-hero__glow--primary" aria-hidden />
        <div className="insurance-page-hero__glow insurance-page-hero__glow--secondary" aria-hidden />
        <div className={cn(siteContainerClass, "relative pt-10 pb-9 md:pt-12 sm:pb-10 lg:pt-14 lg:pb-12")}>
          <h1 className="max-w-2xl font-display text-[1.75rem] font-bold leading-tight tracking-tight text-charcoal sm:text-4xl lg:text-[2.35rem]">
            {t("insurance.page.title")}
          </h1>
          <p className="mt-2.5 max-w-xl text-base leading-relaxed text-slate/90 sm:text-[1.05rem]">
            {t("insurance.page.tagline")}
          </p>
        </div>
      </header>

      <div className={cn(siteContainerClass, "relative pb-14 sm:pb-16 lg:pb-20")}>
        <div
          id="insurance-widget"
          className="insurance-page-widget-shell scroll-mt-[calc(var(--site-header-height,72px)+1rem)]"
        >
          {travelers ? (
            <p className="mb-4 rounded-xl border border-sky/20 bg-sky/5 px-4 py-3 text-sm text-charcoal">
              {t("insurance.checkoutHint").replace("{count}", formatTourists(travelers))}
            </p>
          ) : null}
          <InsuranceWhitelabelWidget
            scriptUrl={scriptUrl}
            loadingLabel={t("insurance.widgetLoading")}
          />
        </div>

        <footer className="mt-10 border-t border-gray-100 pt-8 sm:mt-12 sm:pt-10">
          <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-slate/75">
            {t("insurance.page.disclaimer")}
          </p>
        </footer>
      </div>

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
