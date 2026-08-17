"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
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
import type { SiteDesignGlobal, SiteFormsGlobal } from "@/types/site-globals";
import { SiteFormsProvider } from "@/context/SiteFormsContext";
import OnDemandPublicDialogs from "@/components/OnDemandPublicDialogs";

const CustomCursor = dynamic(() => import("@/components/CustomCursor"), { ssr: false });
const ScrollNavigationRail = dynamic(() => import("@/components/ScrollNavigationRail"), {
  ssr: false,
});
const PwaShell = dynamic(() => import("@/components/pwa/PwaShell"), { ssr: false });
const GuideAssistantWidget = dynamic(() => import("@/components/guide/GuideAssistantWidget"), {
  ssr: false,
});

function IdleMount({
  children,
  delayMs = 2500,
}: {
  children: React.ReactNode;
  delayMs?: number;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | null = null;
    const arm = () => {
      if (cancelled) return;
      setReady(true);
    };

    const ric = window.requestIdleCallback?.(arm, { timeout: delayMs });
    if (ric == null) {
      timeoutId = window.setTimeout(arm, delayMs);
    }

    return () => {
      cancelled = true;
      if (ric != null) window.cancelIdleCallback?.(ric);
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [delayMs]);

  if (!ready) return null;
  return <>{children}</>;
}

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
                  {!isWorkspace && siteDesign?.showCustomCursor !== false ? (
                    <IdleMount delayMs={1200}>
                      <CustomCursor />
                    </IdleMount>
                  ) : null}
                  {!isWorkspace && siteDesign?.showScrollToTop !== false ? (
                    <IdleMount delayMs={1800}>
                      <ScrollNavigationRail
                        showOnMobile={siteDesign?.showScrollToTopMobile === true}
                      />
                    </IdleMount>
                  ) : null}
                  {!isWorkspace ? (
                    <OnDemandPublicDialogs
                      searchEnabled={siteDesign?.showSiteSearch !== false}
                    />
                  ) : null}
                  <CookieConsentBanner />
                  {!isWorkspace ? (
                    <IdleMount delayMs={3500}>
                      <PwaShell />
                    </IdleMount>
                  ) : null}
                  {!isWorkspace ? (
                    <Suspense fallback={null}>
                      <FirstTouchAttributionCapture />
                    </Suspense>
                  ) : null}
                  {!isWorkspace ? (
                    <IdleMount delayMs={4000}>
                      <GuideAssistantWidget />
                    </IdleMount>
                  ) : null}
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
