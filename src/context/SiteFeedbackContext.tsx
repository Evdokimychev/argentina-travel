"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { normalizeSiteError } from "@/lib/site-feedback/normalize-error";
import type {
  SiteFeedbackMessage,
  SiteFeedbackVariant,
  SiteToastItem,
} from "@/types/site-feedback";

type SiteFeedbackContextValue = {
  toasts: SiteToastItem[];
  success: (message: SiteFeedbackMessage) => string;
  error: (error: unknown, context?: Partial<SiteFeedbackMessage>) => string;
  showError: (message: SiteFeedbackMessage) => string;
  info: (message: SiteFeedbackMessage) => string;
  loading: (message: SiteFeedbackMessage) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  update: (id: string, patch: Partial<SiteToastItem>) => void;
  promise: <T>(
    task: Promise<T>,
    messages: {
      loading: SiteFeedbackMessage;
      success: SiteFeedbackMessage | ((value: T) => SiteFeedbackMessage);
      error?: Partial<SiteFeedbackMessage>;
    }
  ) => Promise<T>;
};

const SiteFeedbackContext = createContext<SiteFeedbackContextValue | null>(null);

const DEFAULT_DURATION: Record<SiteFeedbackVariant, number> = {
  success: 5200,
  error: 9000,
  info: 6000,
  loading: 0,
};

function createId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function SiteFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<SiteToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const dismissAll = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  const scheduleDismiss = useCallback(
    (id: string, variant: SiteFeedbackVariant, duration?: number) => {
      const ms = duration ?? DEFAULT_DURATION[variant];
      if (!ms) return;

      const timer = setTimeout(() => dismiss(id), ms);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  const push = useCallback(
    (variant: SiteFeedbackVariant, message: SiteFeedbackMessage) => {
      const id = createId();
      const item: SiteToastItem = {
        id,
        variant,
        createdAt: Date.now(),
        ...message,
      };

      setToasts((current) => [...current.slice(-4), item]);
      scheduleDismiss(id, variant, message.duration);
      return id;
    },
    [scheduleDismiss]
  );

  const update = useCallback((id: string, patch: Partial<SiteToastItem>) => {
    setToasts((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }, []);

  const success = useCallback(
    (message: SiteFeedbackMessage) => push("success", message),
    [push]
  );

  const error = useCallback(
    (err: unknown, context?: Partial<SiteFeedbackMessage>) => {
      const normalized = normalizeSiteError(err, context);
      return push("error", normalized);
    },
    [push]
  );

  const showError = useCallback(
    (message: SiteFeedbackMessage) => push("error", message),
    [push]
  );

  const info = useCallback(
    (message: SiteFeedbackMessage) => push("info", message),
    [push]
  );

  const loading = useCallback(
    (message: SiteFeedbackMessage) => push("loading", { ...message, duration: 0 }),
    [push]
  );

  const promise = useCallback(
    async <T,>(
      task: Promise<T>,
      messages: {
        loading: SiteFeedbackMessage;
        success: SiteFeedbackMessage | ((value: T) => SiteFeedbackMessage);
        error?: Partial<SiteFeedbackMessage>;
      }
    ) => {
      const id = loading(messages.loading);
      try {
        const value = await task;
        dismiss(id);
        const successMessage =
          typeof messages.success === "function" ? messages.success(value) : messages.success;
        success(successMessage);
        return value;
      } catch (err) {
        dismiss(id);
        error(err, messages.error);
        throw err;
      }
    },
    [dismiss, error, loading, success]
  );

  const value = useMemo(
    () => ({
      toasts,
      success,
      error,
      showError,
      info,
      loading,
      dismiss,
      dismissAll,
      update,
      promise,
    }),
    [toasts, success, error, showError, info, loading, dismiss, dismissAll, update, promise]
  );

  return (
    <SiteFeedbackContext.Provider value={value}>{children}</SiteFeedbackContext.Provider>
  );
}

export function useSiteFeedback() {
  const context = useContext(SiteFeedbackContext);
  if (!context) {
    throw new Error("useSiteFeedback must be used within SiteFeedbackProvider");
  }
  return context;
}
