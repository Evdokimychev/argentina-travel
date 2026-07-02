"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useRouteErrorRetry } from "@/hooks/useRouteErrorRetry";
import { captureException } from "@/lib/monitoring/sentry";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";

const DEFAULT_STEPS = [
  "Обновите страницу",
  "Проверьте интернет-соединение",
  "Если ошибка повторяется — напишите нам через форму контактов",
];

export type SiteRouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  description: string;
  steps?: string[];
  retryLabel?: string;
  homeHref?: string;
  homeLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
  /** Встроенная панель кабинета вместо полноэкранного центрирования */
  variant?: "page" | "panel";
};

export default function SiteRouteError({
  error,
  reset,
  title,
  description,
  steps = DEFAULT_STEPS,
  retryLabel = "Попробовать снова",
  homeHref,
  homeLabel,
  secondaryHref,
  secondaryLabel,
  className,
  variant = "page",
}: SiteRouteErrorProps) {
  const handleRetry = useRouteErrorRetry(reset);

  useEffect(() => {
    console.error("Route error:", error);
    captureException(error);
  }, [error]);

  const content = (
    <>
      <span
        className={cn(
          "mx-auto flex items-center justify-center rounded-2xl bg-red-50 text-red-600",
          variant === "panel" ? "h-12 w-12" : "h-14 w-14"
        )}
      >
        <AlertCircle className={variant === "panel" ? "h-6 w-6" : "h-7 w-7"} aria-hidden />
      </span>
      <h1
        className={cn(
          "mt-4 font-heading font-bold text-charcoal",
          variant === "panel" ? "text-xl" : "text-2xl"
        )}
      >
        {title}
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate">{description}</p>
      {steps.length > 0 ? (
        <ul className="mx-auto mt-4 max-w-md list-disc space-y-1 pl-5 text-left text-sm text-slate">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={handleRetry}>
          {retryLabel}
        </Button>
        {homeHref && homeLabel ? (
          <Link href={homeHref} className={buttonVariants({ variant: "outline" })}>
            {homeLabel}
          </Link>
        ) : null}
        {secondaryHref && secondaryLabel ? (
          <Link href={secondaryHref} className={buttonVariants({ variant: "ghost" })}>
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </>
  );

  if (variant === "panel") {
    return (
      <div className={cn("rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center", className)}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={cn(
        siteContainerClass,
        "flex min-h-[50vh] flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      {content}
    </div>
  );
}
