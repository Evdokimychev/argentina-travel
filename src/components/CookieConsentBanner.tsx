"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  acceptAllCookieConsent,
  acceptNecessaryOnlyCookieConsent,
  defaultCookieConsentDraft,
  getCookieConsent,
  hasCookieConsentDecision,
  saveCookieConsent,
  COOKIE_CONSENT_CHANGED_EVENT,
} from "@/lib/cookie-consent";

const CATEGORY_LABELS = {
  necessary: "Необходимые",
  analytics: "Аналитика",
  personalization: "Персонализация",
} as const;

function CategoryToggle({
  id,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-start gap-3 rounded-xl border border-gray-200/80 bg-white/70 px-3 py-2.5",
        disabled && "opacity-80"
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-sky focus:ring-sky/30"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-charcoal">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-slate">{description}</span>
      </span>
    </label>
  );
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [personalization, setPersonalization] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (hasCookieConsentDecision()) {
        setVisible(false);
        return;
      }
      const draft = defaultCookieConsentDraft();
      setAnalytics(draft.analytics);
      setPersonalization(draft.personalization);
      setVisible(true);
    };

    sync();
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, sync);
  }, []);

  function closeWith(preferences: ReturnType<typeof saveCookieConsent>) {
    void preferences;
    setVisible(false);
    setExpanded(false);
  }

  function acceptAll() {
    closeWith(acceptAllCookieConsent());
  }

  function acceptNecessaryOnly() {
    closeWith(acceptNecessaryOnlyCookieConsent());
  }

  function saveSelection() {
    closeWith(saveCookieConsent({ analytics, personalization }));
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Настройки cookie"
      className={cn(
        "fixed bottom-4 left-1/2 z-[80] w-[min(calc(100%-2rem),40rem)] -translate-x-1/2",
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
          <p className="text-sm font-medium text-charcoal">Мы используем cookie</p>
          <p className="mt-1 text-xs leading-relaxed text-slate sm:text-sm">
            Необходимые cookie нужны для входа и работы сайта. Аналитика и персонализация
            включаются только с вашего согласия.{" "}
            <Link href="/legal/cookies" className="font-medium text-sky hover:underline">
              Политика cookie
            </Link>
          </p>

          {expanded ? (
            <div className="mt-3 space-y-2">
              <CategoryToggle
                id="cookie-necessary"
                label={CATEGORY_LABELS.necessary}
                description="Сессия, безопасность, сохранение выбранных настроек интерфейса."
                checked
                disabled
              />
              <CategoryToggle
                id="cookie-analytics"
                label={CATEGORY_LABELS.analytics}
                description="Анонимная статистика посещений и производительности сайта."
                checked={analytics}
                onChange={setAnalytics}
              />
              <CategoryToggle
                id="cookie-personalization"
                label={CATEGORY_LABELS.personalization}
                description="Помощник по сайту и рекомендации на основе ваших интересов."
                checked={personalization}
                onChange={setPersonalization}
              />
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={acceptAll}>
              Принять всё
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={acceptNecessaryOnly}>
              Только необходимые
            </Button>
            {expanded ? (
              <Button type="button" size="sm" variant="secondary" onClick={saveSelection}>
                Сохранить выбор
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  const current = getCookieConsent() ?? defaultCookieConsentDraft();
                  setAnalytics(current.analytics);
                  setPersonalization(current.personalization);
                  setExpanded(true);
                }}
              >
                <Settings2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Настроить
              </Button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={acceptNecessaryOnly}
          data-no-custom-cursor
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            "text-slate transition-colors hover:bg-gray-100 hover:text-charcoal",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/30"
          )}
          aria-label="Закрыть и принять только необходимые cookie"
        >
          <X className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  );
}
