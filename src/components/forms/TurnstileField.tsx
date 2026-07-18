"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";
import { useSiteForms } from "@/context/SiteFormsContext";
import { isCaptchaRequired, type CaptchaFormId } from "@/lib/forms/captcha-policy";

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export default function TurnstileField({
  formId,
  onToken,
  resetSignal = 0,
}: {
  formId: CaptchaFormId;
  onToken: (token: string) => void;
  resetSignal?: number;
}) {
  const { settings, captchaSiteKey } = useSiteForms();
  const required = isCaptchaRequired(settings, formId);
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const previousResetSignalRef = useRef(resetSignal);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!scriptReady || !required || !captchaSiteKey || !containerRef.current || !window.turnstile) return;
    if (widgetRef.current) return;
    widgetRef.current = window.turnstile.render(containerRef.current, {
      sitekey: captchaSiteKey,
      action: formId,
      callback: (token: string) => onToken(token),
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
      theme: "auto",
    });
    return () => {
      if (widgetRef.current && window.turnstile) window.turnstile.remove(widgetRef.current);
      widgetRef.current = null;
    };
  }, [captchaSiteKey, formId, onToken, required, scriptReady]);

  useEffect(() => {
    if (previousResetSignalRef.current === resetSignal) return;
    previousResetSignalRef.current = resetSignal;
    onToken("");
    if (widgetRef.current && window.turnstile) {
      window.turnstile.reset(widgetRef.current);
    }
  }, [onToken, resetSignal]);

  if (!required || !captchaSiteKey) return null;

  return (
    <div className="space-y-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div ref={containerRef} id={`turnstile-${id}`} aria-label="Проверка защиты от спама" />
      <p className="text-xs text-slate">Защищено Cloudflare Turnstile.</p>
    </div>
  );
}
