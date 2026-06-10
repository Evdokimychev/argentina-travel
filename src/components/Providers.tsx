"use client";

import { LocaleCurrencyProvider } from "@/context/LocaleCurrencyContext";
import { AuthProvider } from "@/context/AuthContext";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import CustomCursor from "@/components/CustomCursor";
import NavigationBackButton from "@/components/NavigationBackButton";
import ScrollNavigationRail from "@/components/ScrollNavigationRail";
import SiteSearch from "@/components/SiteSearch";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleCurrencyProvider>
      <AuthProvider>
        {children}
        <CustomCursor />
        <NavigationBackButton />
        <ScrollNavigationRail />
        <SiteSearch />
        <CookieConsentBanner />
      </AuthProvider>
    </LocaleCurrencyProvider>
  );
}
