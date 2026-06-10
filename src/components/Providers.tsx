"use client";

import { LocaleCurrencyProvider } from "@/context/LocaleCurrencyContext";
import { AuthProvider } from "@/context/AuthContext";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import SiteHashScroll from "@/components/SiteHashScroll";
import CustomCursor from "@/components/CustomCursor";
import ScrollNavigationRail from "@/components/ScrollNavigationRail";
import SiteSearch from "@/components/SiteSearch";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleCurrencyProvider>
      <AuthProvider>
        <SiteHashScroll />
        {children}
        <CustomCursor />
        <ScrollNavigationRail />
        <SiteSearch />
        <CookieConsentBanner />
      </AuthProvider>
    </LocaleCurrencyProvider>
  );
}
