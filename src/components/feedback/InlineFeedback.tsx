"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SiteFeedbackAction, SiteFeedbackVariant } from "@/types/site-feedback";

const variantStyles: Record<
  SiteFeedbackVariant,
  { box: string; icon: string; Icon: typeof CheckCircle2 }
> = {
  success: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-950",
    icon: "text-emerald-600",
    Icon: CheckCircle2,
  },
  error: {
    box: "border-red-200 bg-red-50 text-red-950",
    icon: "text-red-600",
    Icon: AlertCircle,
  },
  info: {
    box: "border-sky/25 bg-sky/5 text-charcoal",
    icon: "text-sky",
    Icon: Info,
  },
  loading: {
    box: "border-gray-200 bg-gray-50 text-charcoal",
    icon: "text-slate",
    Icon: Loader2,
  },
};

function FeedbackAction({ action }: { action: SiteFeedbackAction }) {
  const className =
    "mt-3 inline-flex text-sm font-semibold text-sky underline-offset-2 hover:underline";

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  );
}

export default function InlineFeedback({
  variant,
  title,
  description,
  steps,
  action,
  className,
}: {
  variant: SiteFeedbackVariant;
  title: string;
  description?: string;
  steps?: string[];
  action?: SiteFeedbackAction;
  className?: string;
}) {
  const styles = variantStyles[variant];
  const Icon = styles.Icon;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={cn("rounded-xl border px-4 py-3 text-sm", styles.box, className)}
    >
      <div className="flex gap-3">
        <Icon
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            styles.icon,
            variant === "loading" && "animate-spin"
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{title}</p>
          {description ? (
            <p className="mt-1 text-[13px] leading-relaxed opacity-90">{description}</p>
          ) : null}
          {steps && steps.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] leading-relaxed opacity-90">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          ) : null}
          {action ? <FeedbackAction action={action} /> : null}
        </div>
      </div>
    </div>
  );
}
