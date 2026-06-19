"use client";

import { LocaleCurrencyProvider } from "@/context/LocaleCurrencyContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { SiteFeedbackProvider } from "@/context/SiteFeedbackContext";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import SiteAnalytics from "@/components/SiteAnalytics";
import SiteHashScroll from "@/components/SiteHashScroll";
import CustomCursor from "@/components/CustomCursor";
import ScrollNavigationRail from "@/components/ScrollNavigationRail";
import SiteSearch from "@/components/SiteSearch";
import SiteToastHost from "@/components/feedback/SiteToastHost";
import RouteProgressBar from "@/components/feedback/RouteProgressBar";
import PwaShell from "@/components/pwa/PwaShell";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleCurrencyProvider>
        <SiteFeedbackProvider>
          <AuthProvider>
            <RouteProgressBar />
            <SiteHashScroll />
            {children}
            <CustomCursor />
            <ScrollNavigationRail />
            <SiteSearch />
          <CookieConsentBanner />
          <PwaShell />
          <SiteAnalytics />
            <SiteToastHost />
          </AuthProvider>
        </SiteFeedbackProvider>
      </LocaleCurrencyProvider>
    </ThemeProvider>
  );
}
