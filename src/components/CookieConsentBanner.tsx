"use client";

import { useEffect, useState } from "react";
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
          <p className="text-sm font-semibold text-charcoal sm:text-base">Настройки cookie</p>
          <p className="mt-1 text-sm leading-relaxed text-slate">
            Необходимые cookie обеспечивают вход и бронирование. Аналитику и персональные рекомендации включаем только с вашего согласия.{" "}
            <Link href="/legal/cookies" className="font-medium text-sky-ink hover:underline">
              Подробнее
            </Link>
          </p>

          {customizing ? (
            <div className="mt-4 space-y-3 rounded-xl bg-surface-muted p-3">
              <label className="flex items-start gap-3 text-sm text-charcoal">
                <input type="checkbox" checked disabled className="mt-1" />
                <span><strong className="block">Необходимые</strong><span className="text-xs text-slate">Вход, безопасность, корзина и бронирование.</span></span>
              </label>
              <label className="flex items-start gap-3 text-sm text-charcoal">
                <input type="checkbox" checked={draft.analytics} onChange={(event) => setDraft({ ...draft, analytics: event.target.checked })} className="mt-1" />
                <span><strong className="block">Аналитика</strong><span className="text-xs text-slate">Помогает находить ошибки и медленные страницы. Поля форм не передаются.</span></span>
              </label>
              <label className="flex items-start gap-3 text-sm text-charcoal">
                <input type="checkbox" checked={draft.personalization} onChange={(event) => setDraft({ ...draft, personalization: event.target.checked })} className="mt-1" />
                <span><strong className="block">Рекомендации</strong><span className="text-xs text-slate">Использует историю действий, чтобы показывать подходящие места и туры.</span></span>
              </label>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={acceptAll}>
              Принять все
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={acceptNecessary}>Только необходимые</Button>
            {customizing ? (
              <Button type="button" size="sm" variant="outline" onClick={saveCustom}>Сохранить выбор</Button>
            ) : (
              <Button type="button" size="sm" variant="outline" onClick={() => setCustomizing(true)}>Настроить</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
