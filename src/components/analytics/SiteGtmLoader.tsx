"use client";

import Script from "next/script";
import { useEffect } from "react";
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  getCookieConsent,
} from "@/lib/cookie-consent";
import { syncGtmConsent } from "@/lib/analytics/gtm-consent";
import { getGtmPublicConfig } from "@/lib/analytics/gtm-config";

/** Loads GTM after hydration; syncs consent with the cookie banner. */
export default function SiteGtmLoader() {
  const gtmId = getGtmPublicConfig().gtmId;

  useEffect(() => {
    if (!gtmId) return;

    const preferences = getCookieConsent();
    if (preferences) {
      syncGtmConsent(preferences);
    }

    const onConsentChange = () => {
      const next = getCookieConsent();
      if (next) syncGtmConsent(next);
    };

    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsentChange);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsentChange);
  }, [gtmId]);

  if (!gtmId) return null;

  return (
    <>
      <Script
        id="gtm-loader"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
        }}
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
