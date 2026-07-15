"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import type { LocaleCode } from "@/types/locale";
import { LocaleCurrencyProvider } from "@/context/LocaleCurrencyContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { UserExperienceProvider } from "@/context/UserExperienceContext";
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
  const pathname = usePathname();
  const isWorkspace =
    pathname?.startsWith("/profile") ||
    pathname?.startsWith("/organizer") ||
    pathname?.startsWith("/admin");

  return (
    <ThemeProvider>
      <LocaleCurrencyProvider initialLocale={locale}>
        <SiteFeedbackProvider>
          <AuthProvider>
            <UserExperienceProvider>
              <QuickExploreProvider>
                <InteractionTrackingProvider>
                <RouteProgressBar />
                <SiteHashScroll />
                {children}
                {!isWorkspace ? <CustomCursor /> : null}
                {!isWorkspace ? <ScrollNavigationRail /> : null}
                {!isWorkspace ? <SiteSearch /> : null}
                {!isWorkspace ? <QuickExploreMapDialog /> : null}
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
              </QuickExploreProvider>
            </UserExperienceProvider>
          </AuthProvider>
        </SiteFeedbackProvider>
      </LocaleCurrencyProvider>
    </ThemeProvider>
  );
}
