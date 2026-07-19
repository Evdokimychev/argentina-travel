"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import type { LocaleCode } from "@/types/locale";
import { LocaleCurrencyProvider } from "@/context/LocaleCurrencyContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { UserExperienceProvider } from "@/context/UserExperienceContext";
import { SiteFeedbackProvider } from "@/context/SiteFeedbackContext";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import SiteAnalytics from "@/components/SiteAnalytics";
import SiteHashScroll from "@/components/SiteHashScroll";
import SiteToastHost from "@/components/feedback/SiteToastHost";
import RouteProgressBar from "@/components/feedback/RouteProgressBar";
import FirstTouchAttributionCapture from "@/components/attribution/FirstTouchAttributionCapture";
import InteractionTrackingProvider from "@/components/personalization/InteractionTrackingProvider";
import { isWorkspacePath } from "@/lib/internal-route-access";
import { TooltipProvider } from "@/components/ui/tooltip";
import OnDemandPublicDialogs from "@/components/OnDemandPublicDialogs";
import type { SiteDesignGlobal } from "@/types/site-globals";
import type { SiteFormsGlobal } from "@/types/site-globals";
import { SiteFormsProvider } from "@/context/SiteFormsContext";

const CustomCursor = dynamic(() => import("@/components/CustomCursor"), { ssr: false });
const ScrollNavigationRail = dynamic(() => import("@/components/ScrollNavigationRail"), {
  ssr: false,
});
const PwaShell = dynamic(() => import("@/components/pwa/PwaShell"), { ssr: false });
const GuideAssistantWidget = dynamic(() => import("@/components/guide/GuideAssistantWidget"), {
  ssr: false,
});

export default function Providers({
  children,
  locale,
  siteDesign,
  siteForms,
  captchaSiteKey,
}: {
  children: React.ReactNode;
  locale?: LocaleCode;
  siteDesign?: SiteDesignGlobal;
  siteForms: SiteFormsGlobal;
  captchaSiteKey: string | null;
}) {
  const pathname = usePathname();
  const isWorkspace = isWorkspacePath(pathname);

  return (
    <TooltipProvider delayDuration={450} skipDelayDuration={250}>
      <ThemeProvider>
        <LocaleCurrencyProvider initialLocale={locale}>
          <SiteFormsProvider settings={siteForms} captchaSiteKey={captchaSiteKey}>
            <SiteFeedbackProvider>
              <AuthProvider>
                <UserExperienceProvider>
                  <InteractionTrackingProvider>
                    {siteDesign?.showRouteProgress !== false ? <RouteProgressBar /> : null}
                    <SiteHashScroll />
                    {children}
                    {!isWorkspace && siteDesign?.showCustomCursor !== false ? <CustomCursor /> : null}
                    {!isWorkspace && siteDesign?.showScrollToTop !== false ? (
                      <ScrollNavigationRail
                        showOnMobile={siteDesign?.showScrollToTopMobile === true}
                      />
                    ) : null}
                    {!isWorkspace ? (
                      <OnDemandPublicDialogs searchEnabled={siteDesign?.showSiteSearch !== false} />
                    ) : null}
                    <CookieConsentBanner />
                    {!isWorkspace ? <PwaShell /> : null}
                    {!isWorkspace ? (
                      <Suspense fallback={null}>
                        <FirstTouchAttributionCapture />
                      </Suspense>
                    ) : null}
                    {!isWorkspace ? <GuideAssistantWidget /> : null}
                    <SiteAnalytics />
                    <SiteToastHost />
                  </InteractionTrackingProvider>
                </UserExperienceProvider>
              </AuthProvider>
            </SiteFeedbackProvider>
          </SiteFormsProvider>
        </LocaleCurrencyProvider>
      </ThemeProvider>
    </TooltipProvider>
  );
}
