"use client";

import { LocaleCurrencyProvider } from "@/context/LocaleCurrencyContext";
import { AuthProvider } from "@/context/AuthContext";
import CookieConsentBanner from "@/components/CookieConsentBanner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleCurrencyProvider>
      <AuthProvider>
        {children}
        <CookieConsentBanner />
      </AuthProvider>
    </LocaleCurrencyProvider>
  );
}
