"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import type { LocaleCode } from "@/types/locale";
import { LocaleCurrencyProvider } from "@/context/LocaleCurrencyContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { QuickExploreProvider } from "@/context/QuickExploreContext";
import { SiteFeedbackProvider } from "@/context/SiteFeedbackContext";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import SiteAnalytics from "@/components/SiteAnalytics";
import SiteHashScroll from "@/components/SiteHashScroll";
import SiteToastHost from "@/components/feedback/SiteToastHost";
import RouteProgressBar from "@/components/feedback/RouteProgressBar";
import FirstTouchAttributionCapture from "@/components/attribution/FirstTouchAttributionCapture";
import InteractionTrackingProvider from "@/components/personalization/InteractionTrackingProvider";

const CustomCursor = dynamic(() => import("@/components/CustomCursor"), { ssr: false });
const ScrollNavigationRail = dynamic(() => import("@/components/ScrollNavigationRail"), {
  ssr: false,
});
const SiteSearch = dynamic(() => import("@/components/SiteSearch"), { ssr: false });
const QuickExploreMapDialog = dynamic(
  () => import("@/components/quick-explore/QuickExploreMapDialog"),
  { ssr: false }
);
const PwaShell = dynamic(() => import("@/components/pwa/PwaShell"), { ssr: false });
const GuideAssistantWidget = dynamic(() => import("@/components/guide/GuideAssistantWidget"), {
  ssr: false,
});

export default function Providers({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale?: LocaleCode;
}) {
  return (
    <ThemeProvider>
      <LocaleCurrencyProvider initialLocale={locale}>
        <SiteFeedbackProvider>
          <AuthProvider>
            <QuickExploreProvider>
              <InteractionTrackingProvider>
                <RouteProgressBar />
                <SiteHashScroll />
                {children}
                <CustomCursor />
                <ScrollNavigationRail />
                <SiteSearch />
                <QuickExploreMapDialog />
                <CookieConsentBanner />
                <PwaShell />
                <Suspense fallback={null}>
                  <FirstTouchAttributionCapture />
                </Suspense>
                <GuideAssistantWidget />
                <SiteAnalytics />
                <SiteToastHost />
              </InteractionTrackingProvider>
            </QuickExploreProvider>
          </AuthProvider>
        </SiteFeedbackProvider>
      </LocaleCurrencyProvider>
    </ThemeProvider>
  );
}
