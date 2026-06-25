"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, Info, Loader2, X } from "lucide-react";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { cn } from "@/lib/cn";
import { motionClass } from "@/lib/motion";
import type { SiteFeedbackVariant } from "@/types/site-feedback";

const iconByVariant: Record<
  SiteFeedbackVariant,
  { Icon: typeof CheckCircle2; className: string }
> = {
  success: { Icon: CheckCircle2, className: "text-emerald-600" },
  error: { Icon: AlertCircle, className: "text-red-600" },
  info: { Icon: Info, className: "text-sky" },
  loading: { Icon: Loader2, className: "text-slate animate-spin" },
};

const boxByVariant: Record<SiteFeedbackVariant, string> = {
  success: "border-emerald-200/80 bg-white/95",
  error: "border-red-200/80 bg-white/95",
  info: "border-sky/20 bg-white/95",
  loading: "border-gray-200/80 bg-white/95",
};

export default function SiteToastHost() {
  const { toasts, dismiss } = useSiteFeedback();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-toast site-toast-host flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end sm:px-0"
    >
      {toasts.map((toast) => {
        const { Icon, className: iconClassName } = iconByVariant[toast.variant];

        return (
          <div
            key={toast.id}
            role={toast.variant === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto w-full max-w-sm rounded-2xl border p-4 shadow-elevated backdrop-blur-sm",
              motionClass.toast,
              boxByVariant[toast.variant]
            )}
          >
            <div className="flex gap-3">
              <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconClassName)} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-charcoal">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-xs leading-relaxed text-slate">{toast.description}</p>
                ) : null}
                {toast.steps && toast.steps.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs leading-relaxed text-slate">
                    {toast.steps.slice(0, 3).map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                ) : null}
                {toast.action ? (
                  toast.action.href ? (
                    <Link
                      href={toast.action.href}
                      onClick={() => dismiss(toast.id)}
                      className="mt-2 inline-flex text-xs font-semibold text-sky hover:underline"
                    >
                      {toast.action.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        toast.action?.onClick?.();
                        dismiss(toast.id);
                      }}
                      className="mt-2 inline-flex text-xs font-semibold text-sky hover:underline"
                    >
                      {toast.action.label}
                    </button>
                  )
                ) : null}
              </div>
              {toast.variant !== "loading" ? (
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate transition-colors hover:bg-gray-100 hover:text-charcoal"
                  aria-label="Закрыть уведомление"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
