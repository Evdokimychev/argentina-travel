"use client";

import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { OnboardingStep } from "@/types/onboarding";

interface OnboardingProgressProps {
  steps: OnboardingStep[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
  onAction?: (step: OnboardingStep) => void;
  className?: string;
}

function StepIndicator({ status }: { status: OnboardingStep["status"] }) {
  if (status === "completed") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      </span>
    );
  }

  if (status === "current") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-sky bg-sky/10">
        <span className="h-2.5 w-2.5 rounded-full bg-sky" aria-hidden />
      </span>
    );
  }

  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-slate">
      <Circle className="h-3 w-3" strokeWidth={2} aria-hidden />
    </span>
  );
}

export default function OnboardingProgress({
  steps,
  title,
  subtitle,
  compact = false,
  onAction,
  className,
}: OnboardingProgressProps) {
  const completedCount = steps.filter((step) => step.status === "completed").length;

  return (
    <div className={cn("space-y-4", className)}>
      {title ? (
        <div>
          <h2 className="font-heading text-lg font-bold text-charcoal sm:text-xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm leading-relaxed text-slate">{subtitle}</p> : null}
          <p className="mt-2 text-xs font-medium text-slate">
            Выполнено {completedCount} из {steps.length}
          </p>
        </div>
      ) : null}

      <ol className={cn("space-y-0", compact ? "space-y-2" : "space-y-0")}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;
          const actionContent = step.actionLabel ? (
            step.href ? (
              <Link
                href={step.href}
                className="inline-flex text-xs font-semibold text-sky transition-colors hover:text-sky-dark hover:underline"
              >
                {step.actionLabel}
              </Link>
            ) : onAction ? (
              <button
                type="button"
                onClick={() => onAction(step)}
                className="inline-flex text-xs font-semibold text-sky transition-colors hover:text-sky-dark hover:underline"
              >
                {step.actionLabel}
              </button>
            ) : null
          ) : null;

          return (
            <li key={step.id} className="relative flex gap-3">
              {!isLast && !compact ? (
                <span
                  className={cn(
                    "absolute left-3.5 top-8 h-[calc(100%-0.5rem)] w-px -translate-x-1/2",
                    step.status === "completed" ? "bg-emerald-200" : "bg-gray-200"
                  )}
                  aria-hidden
                />
              ) : null}

              <div className="relative z-[1] pt-0.5">
                <StepIndicator status={step.status} />
              </div>

              <div
                className={cn(
                  "min-w-0 flex-1",
                  compact ? "rounded-xl border border-gray-100 bg-white/80 px-3 py-2.5" : "pb-5"
                )}
              >
                <div className="flex items-start gap-2">
                  {Icon ? (
                    <Icon
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        step.status === "completed"
                          ? "text-emerald-600"
                          : step.status === "current"
                            ? "text-sky"
                            : "text-slate"
                      )}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        step.status === "pending" ? "text-slate" : "text-charcoal"
                      )}
                    >
                      {step.title}
                    </p>
                    {!compact ? (
                      <p className="mt-1 text-sm leading-relaxed text-slate">{step.description}</p>
                    ) : null}
                    {actionContent && step.status !== "completed" ? (
                      <div className="mt-2">{actionContent}</div>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
