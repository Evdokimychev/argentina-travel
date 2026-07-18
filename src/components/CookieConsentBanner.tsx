"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  acceptAllCookieConsent,
  acceptNecessaryOnlyCookieConsent,
  defaultCookieConsentDraft,
  hasAnalyticsConsent,
  hasCookieConsentDecision,
  saveCookieConsent,
  COOKIE_CONSENT_CHANGED_EVENT,
  COOKIE_CONSENT_OPEN_EVENT,
} from "@/lib/cookie-consent";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [draft, setDraft] = useState(() => defaultCookieConsentDraft());
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => {
      setVisible(!hasCookieConsentDecision());
    };
    const open = () => {
      setDraft(defaultCookieConsentDraft());
      setCustomizing(true);
      setVisible(true);
    };

    sync();
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, sync);
    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, open);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, sync);
      window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, open);
    };
  }, []);

  useEffect(() => {
    if (!visible || !bannerRef.current) {
      document.documentElement.style.removeProperty("--cookie-consent-offset");
      delete document.documentElement.dataset.cookieConsentVisible;
      return;
    }

    const banner = bannerRef.current;
    document.documentElement.dataset.cookieConsentVisible = "true";
    const updateOffset = () => {
      document.documentElement.style.setProperty(
        "--cookie-consent-offset",
        `${Math.ceil(banner.getBoundingClientRect().height + 24)}px`,
      );
    };
    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(banner);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--cookie-consent-offset");
      delete document.documentElement.dataset.cookieConsentVisible;
    };
  }, [visible, customizing]);

  function acceptAll() {
    acceptAllCookieConsent();
    setVisible(false);
  }

  function acceptNecessary() {
    const shouldReload = hasAnalyticsConsent();
    acceptNecessaryOnlyCookieConsent();
    setVisible(false);
    if (shouldReload) window.location.reload();
  }

  function saveCustom() {
    const shouldReload = hasAnalyticsConsent() && !draft.analytics;
    saveCookieConsent(draft);
    setVisible(false);
    if (shouldReload) window.location.reload();
  }

  if (!visible) return null;

  // Немодальное уведомление: role="region", а не dialog — не перехватывает фокус и не требует кнопки «Закрыть»
  return (
    <div
      ref={bannerRef}
      role="region"
      aria-label="Уведомление о cookie"
      className={cn(
        "fixed bottom-1.5 left-1/2 z-cookie w-[min(calc(100%-0.75rem),40rem)] -translate-x-1/2 sm:bottom-4 sm:w-[min(calc(100%-2rem),40rem)]",
        "max-h-[calc(100dvh-0.75rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] overflow-y-auto overscroll-contain rounded-2xl border border-gray-200/80 bg-white/95 p-3 shadow-lg backdrop-blur-md sm:max-h-[calc(100dvh-2rem)] sm:p-5"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky/10 text-sky sm:flex"
          aria-hidden
        >
          <Cookie className="h-4 w-4" strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-charcoal sm:text-base">Настройки cookie</p>
          <p className="mt-1 text-xs leading-snug text-slate sm:text-sm sm:leading-relaxed">
            <span className="sm:hidden">Нужные cookie работают всегда. Аналитика — только с согласия. </span>
            <span className="hidden sm:inline">Необходимые cookie обеспечивают вход и бронирование. Аналитику и персональные рекомендации включаем только с вашего согласия. </span>
            <Link href="/legal/cookies" className="font-medium text-sky-ink hover:underline">
              Подробнее
            </Link>
          </p>

          {customizing ? (
            <div className="mt-4 space-y-3 rounded-xl bg-surface-muted p-3">
              <label className="flex min-h-11 items-start gap-3 rounded-lg text-sm text-charcoal">
                <input type="checkbox" checked disabled className="mt-1" />
                <span><strong className="block">Необходимые</strong><span className="text-xs text-slate">Вход, безопасность, корзина и бронирование.</span></span>
              </label>
              <label className="flex min-h-11 items-start gap-3 rounded-lg text-sm text-charcoal">
                <input type="checkbox" checked={draft.analytics} onChange={(event) => setDraft({ ...draft, analytics: event.target.checked })} className="mt-1" />
                <span><strong className="block">Аналитика</strong><span className="text-xs text-slate">Помогает находить ошибки и медленные страницы. Поля форм не передаются.</span></span>
              </label>
              <label className="flex min-h-11 items-start gap-3 rounded-lg text-sm text-charcoal">
                <input type="checkbox" checked={draft.personalization} onChange={(event) => setDraft({ ...draft, personalization: event.target.checked })} className="mt-1" />
                <span><strong className="block">Рекомендации</strong><span className="text-xs text-slate">Использует историю действий, чтобы показывать подходящие места и туры.</span></span>
              </label>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
            <Button type="button" size="sm" variant="outline" className="min-h-11 px-1.5 text-xs sm:px-3" onClick={acceptAll}>
              <span className="sm:hidden">Все</span><span className="hidden sm:inline">Принять все</span>
            </Button>
            <Button type="button" size="sm" variant="outline" className="min-h-11 px-1.5 text-xs sm:px-3" onClick={acceptNecessary}><span className="sm:hidden">Только нужные</span><span className="hidden sm:inline">Только необходимые</span></Button>
            {customizing ? (
              <Button type="button" size="sm" variant="outline" className="min-h-11 px-2 text-xs sm:px-3" onClick={saveCustom}>Сохранить выбор</Button>
            ) : (
              <Button type="button" size="sm" variant="ghost" className="min-h-11 px-1.5 text-xs sm:px-3" onClick={() => setCustomizing(true)}><span className="sm:hidden">Выбор</span><span className="hidden sm:inline">Настроить</span></Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
