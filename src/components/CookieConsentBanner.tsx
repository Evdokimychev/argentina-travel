"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  acceptAllCookieConsent,
  hasCookieConsentDecision,
  COOKIE_CONSENT_CHANGED_EVENT,
} from "@/lib/cookie-consent";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => {
      setVisible(!hasCookieConsentDecision());
    };

    sync();
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, sync);
  }, []);

  function acceptAll() {
    acceptAllCookieConsent();
    setVisible(false);
  }

  if (!visible) return null;

  // Немодальное уведомление: role="region", а не dialog — не перехватывает фокус и не требует кнопки «Закрыть»
  return (
    <div
      role="region"
      aria-label="Уведомление о cookie"
      className={cn(
        "fixed bottom-4 left-1/2 z-cookie w-[min(calc(100%-2rem),40rem)] -translate-x-1/2",
        "rounded-2xl border border-gray-200/80 bg-white/95 p-4 shadow-lg backdrop-blur-md sm:p-5"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky/10 text-sky"
          aria-hidden
        >
          <Cookie className="h-4 w-4" strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-charcoal sm:text-base">
            Мы используем куки и рекомендательные технологии — без них сайт «Пора в Аргентину» просто не
            сможет нормально работать.{" "}
            <Link href="/legal/cookies" className="font-medium text-sky-ink hover:underline">
              Подробнее
            </Link>
          </p>

          <div className="mt-4">
            <Button type="button" size="sm" onClick={acceptAll}>
              Да, без проблем
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
