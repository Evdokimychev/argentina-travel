"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing } from "lucide-react";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { cabinetPanelClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  hasAnalyticsConsent,
} from "@/lib/cookie-consent";

type PushNotificationsSectionProps = {
  className?: string;
};

const PUSH_SW_URL = "/sw-push.js";
const PUSH_SCOPE = "/push/";

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(normalized);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i += 1) {
    bytes[i] = decoded.charCodeAt(i);
  }
  return bytes.buffer;
}

function isLocalhost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

async function getPushRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const scopeUrl = new URL(PUSH_SCOPE, window.location.origin).toString();
    return (await navigator.serviceWorker.getRegistration(scopeUrl)) ?? null;
  } catch {
    return null;
  }
}

async function ensurePushRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await getPushRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.register(PUSH_SW_URL, { scope: PUSH_SCOPE });
}

async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const registration = await getPushRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

export default function PushNotificationsSection({ className }: PushNotificationsSectionProps) {
  const remoteEnabled = isSupabaseAuthEnabled();
  const vapidPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim() ?? "";

  const [supported, setSupported] = useState(false);
  const [consentGranted, setConsentGranted] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supportIssue = useMemo(() => {
    if (!remoteEnabled) return "Push-канал доступен только в режиме Supabase Auth.";
    if (!vapidPublicKey) return "Push-канал пока не настроен на сервере.";
    if (typeof window !== "undefined") {
      const secureContextAllowed = window.isSecureContext || isLocalhost(window.location.hostname);
      if (!secureContextAllowed) return "Push работает только по HTTPS.";
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return "Ваш браузер не поддерживает web push.";
      }
    }
    return null;
  }, [remoteEnabled, vapidPublicKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    const canUsePush = supportIssue === null;
    setSupported(canUsePush);
    setConsentGranted(hasAnalyticsConsent());

    async function syncState() {
      if (!canUsePush) {
        if (!cancelled) {
          setEnabled(false);
          setLoading(false);
        }
        return;
      }

      const subscription = await getCurrentSubscription();
      if (!cancelled) {
        setEnabled(Boolean(subscription));
        setLoading(false);
      }
    }

    void syncState();

    const onConsentChanged = () => {
      setConsentGranted(hasAnalyticsConsent());
    };
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsentChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsentChanged);
    };
  }, [supportIssue]);

  async function unsubscribeCurrentDevice(reason?: string) {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const subscription = await getCurrentSubscription();
      const endpoint = subscription?.endpoint ?? null;

      if (subscription) {
        try {
          await subscription.unsubscribe();
        } catch {
          /* ignore browser-level unsubscribe errors */
        }
      }

      const response = await fetch("/api/notifications/push/subscribe", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(endpoint ? { endpoint } : {}),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось отключить push-уведомления");
      }

      setEnabled(false);
      setMessage(reason ?? "Push-уведомления отключены.");
    } catch (unsubscribeError) {
      setError(unsubscribeError instanceof Error ? unsubscribeError.message : "Ошибка отключения");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!supported || !enabled || consentGranted) return;
    void unsubscribeCurrentDevice(
      "Push-уведомления отключены: нет согласия на аналитику."
    );
  }, [supported, enabled, consentGranted]);

  async function handleEnable() {
    if (!supported) return;
    if (!consentGranted) {
      setError("Сначала разрешите аналитику в настройках cookies.");
      return;
    }
    if (!vapidPublicKey) {
      setError("Push-канал пока не настроен.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      if (permission !== "granted") {
        throw new Error("Браузер не выдал разрешение на уведомления.");
      }

      const registration = await ensurePushRegistration();
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToArrayBuffer(vapidPublicKey),
        });
      }

      const details = subscription.toJSON();
      const endpoint = typeof details.endpoint === "string" ? details.endpoint : null;
      const p256dh = details.keys?.p256dh ?? null;
      const auth = details.keys?.auth ?? null;

      if (!endpoint || !p256dh || !auth) {
        throw new Error("Не удалось получить данные push-подписки.");
      }

      const response = await fetch("/api/notifications/push/subscribe", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, p256dh, auth }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось сохранить push-подписку.");
      }

      setEnabled(true);
      setMessage("Push-уведомления включены.");
    } catch (enableError) {
      setError(enableError instanceof Error ? enableError.message : "Ошибка подключения push");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    if (saving) return;
    if (enabled) {
      await unsubscribeCurrentDevice();
      return;
    }
    await handleEnable();
  }

  return (
    <section className={cn(cabinetPanelClass, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-sky/10 text-sky">
            <BellRing className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-heading text-lg font-bold text-charcoal">Push-уведомления</h2>
            <p className="mt-1 text-sm text-slate">
              Мгновенные уведомления о статусе заявок в браузере.
            </p>
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-charcoal">
          <span>{enabled ? "Вкл" : "Выкл"}</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={() => void handleToggle()}
            disabled={loading || saving || !supported}
            className="h-4 w-4 rounded border-gray-300 text-sky focus:ring-sky/30"
            aria-label="Переключить push-уведомления"
          />
        </label>
      </div>

      {!consentGranted ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Для push-уведомлений нужно согласие на аналитику.
        </p>
      ) : null}

      {supportIssue ? <p className="mt-3 text-sm text-slate">{supportIssue}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-success">{message}</p> : null}
      {loading ? <p className="mt-3 text-sm text-slate">Проверяем статус push-подписки…</p> : null}
    </section>
  );
}
