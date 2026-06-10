"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const CONSENT_KEY = "site-cookie-consent";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(CONSENT_KEY) !== "accepted") {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(CONSENT_KEY, "accepted");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Уведомление о cookie"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[80] border-t border-gray-200 bg-white/95 p-4 shadow-modal backdrop-blur-md",
        "sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md sm:rounded-2xl sm:border"
      )}
    >
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky">
          <Cookie className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-charcoal">Мы используем cookie</p>
          <p className="mt-1 text-xs leading-relaxed text-slate">
            Cookie помогают сохранить язык, валюту и настройки сессии. Подробнее — в{" "}
            <Link href="/legal/privacy" className="font-medium text-sky hover:underline">
              политике конфиденциальности
            </Link>
            .
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={accept}>
              Принять
            </Button>
            <Link href="/legal/privacy" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Подробнее
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
