"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { acceptCookieConsent, hasCookieConsent } from "@/lib/cookie-consent";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!hasCookieConsent()) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    acceptCookieConsent();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Уведомление о cookie"
      className={cn(
        "fixed bottom-5 left-1/2 z-[80] flex max-w-[min(calc(100%-2rem),34rem)] -translate-x-1/2 items-center gap-2.5",
        "rounded-full px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5",
        "bg-charcoal/10 text-charcoal/65 shadow-sm backdrop-blur-sm"
      )}
    >
      <Cookie className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />

      <p className="min-w-0 flex-1 text-xs leading-snug sm:text-sm">
        <span>Сайт сохраняет cookie на вашем устройстве. </span>
        <Link
          href="/legal/cookies"
          className="font-medium text-charcoal/85 underline-offset-2 transition-colors hover:text-charcoal hover:underline"
        >
          Политика cookie
        </Link>
      </p>

      <button
        type="button"
        onClick={accept}
        data-no-custom-cursor
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          "text-charcoal/55 transition-colors hover:bg-charcoal/10 hover:text-charcoal/85",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal/20 focus-visible:ring-offset-2"
        )}
        aria-label="Закрыть и принять"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
