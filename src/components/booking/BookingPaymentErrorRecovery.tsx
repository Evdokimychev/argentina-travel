"use client";

import Link from "next/link";
import { AlertCircle, LifeBuoy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import type { SiteFeedbackMessage } from "@/types/site-feedback";
import { cn } from "@/lib/cn";

export default function BookingPaymentErrorRecovery({
  title = "Не удалось продолжить оплату",
  description,
  steps,
  onRetry,
  retryLabel = "Повторить оплату",
  retryHref,
  retryLoading = false,
  retryLoadingLabel = "Повторяем…",
  feedback,
  className,
}: {
  title?: string;
  description?: string;
  steps?: string[];
  onRetry?: () => void;
  retryLabel?: string;
  retryHref?: string;
  retryLoading?: boolean;
  retryLoadingLabel?: string;
  feedback?: SiteFeedbackMessage | null;
  className?: string;
}) {
  const showRetry = Boolean(onRetry || retryHref);

  return (
    <div
      className={cn(
        "rounded-xl border border-red-200 bg-red-50/80 px-4 py-4 text-sm text-red-900",
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{title}</p>
          {description ? <p className="mt-1 leading-relaxed">{description}</p> : null}
          {steps && steps.length > 0 ? (
            <ul className="mt-2 list-inside list-disc space-y-1 text-red-800/90">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {feedback ? (
        <InlineFeedback
          variant="error"
          title={feedback.title}
          description={feedback.description}
          steps={feedback.steps}
          action={feedback.action}
          className="mt-4 border-red-200 bg-white"
        />
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {showRetry ? (
          onRetry ? (
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={onRetry}
              loading={retryLoading}
              loadingLabel={retryLoadingLabel}
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              {retryLabel}
            </Button>
          ) : retryHref ? (
            <Link
              href={retryHref}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark sm:w-auto"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              {retryLabel}
            </Link>
          ) : null
        ) : null}
        <Link
          href="/contacts"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 text-sm font-semibold text-charcoal transition-colors hover:bg-red-50/50 sm:w-auto"
        >
          <LifeBuoy className="h-4 w-4 text-slate" aria-hidden />
          Написать в поддержку
        </Link>
      </div>
    </div>
  );
}
