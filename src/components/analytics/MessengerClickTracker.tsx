"use client";

import { useEffect } from "react";
import { hasAnalyticsConsent } from "@/lib/cookie-consent";
import { trackMessengerClick } from "@/lib/analytics/gtm-events";

function resolveMessengerChannel(href: string): "whatsapp" | "telegram" | null {
  const lower = href.toLowerCase();
  if (lower.includes("wa.me") || lower.includes("whatsapp.com") || lower.includes("api.whatsapp")) {
    return "whatsapp";
  }
  if (lower.includes("t.me") || lower.includes("telegram.me") || lower.includes("telegram.org")) {
    return "telegram";
  }
  return null;
}

/** Delegated click tracking for WhatsApp / Telegram links sitewide. */
export default function MessengerClickTracker() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!hasAnalyticsConsent()) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const channel = resolveMessengerChannel(anchor.href);
      if (!channel) return;

      trackMessengerClick({
        channel,
        href: anchor.href,
        label: anchor.textContent?.trim() || undefined,
      });
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
