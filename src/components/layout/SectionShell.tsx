"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRevealAnimation } from "@/hooks/useRevealAnimation";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";

export interface SectionShellProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  children?: React.ReactNode;
  className?: string;
  innerClassName?: string;
  headerClassName?: string;
  id?: string;
  reveal?: boolean;
  tone?: "light" | "muted" | "dark";
  scrollRailTone?: "light" | "dark";
}

const TONE_CLASS = {
  light: "",
  muted: "bg-surface-muted/50",
  dark: "bg-patagonia text-white",
} as const;

function revealSectionClass(revealed: boolean) {
  return cn(
    !revealed && "opacity-0 translate-y-3",
    revealed && "animate-fade-in-up motion-reduce:translate-y-0"
  );
}

export default function SectionShell({
  eyebrow,
  title,
  subtitle,
  href,
  linkLabel,
  children,
  className,
  innerClassName,
  headerClassName,
  id,
  reveal = false,
  tone = "light",
  scrollRailTone,
}: SectionShellProps) {
  const { ref, revealed } = useRevealAnimation<HTMLElement>(0.08);
  const isDark = tone === "dark";

  return (
    <section
      id={id}
      ref={reveal ? ref : undefined}
      data-scroll-rail-tone={scrollRailTone}
      className={cn(
        "py-12 md:py-14",
        TONE_CLASS[tone],
        reveal && revealSectionClass(revealed),
        className
      )}
    >
      <div className={cn(siteContainerClass, innerClassName)}>
        <div
          className={cn(
            "mb-6 flex items-end justify-between gap-4",
            !children && "mb-0",
            headerClassName
          )}
        >
          <div className="min-w-0">
            {eyebrow ? (
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  isDark ? "text-sky-light/90" : "text-sky-ink"
                )}
              >
                {eyebrow}
              </p>
            ) : null}
            <h2
              className={cn(
                "font-heading text-2xl font-bold sm:text-3xl",
                eyebrow && "mt-2",
                isDark ? "text-white" : "text-charcoal"
              )}
            >
              {title}
            </h2>
            {subtitle ? (
              <p
                className={cn(
                  "mt-1.5 max-w-2xl text-sm leading-relaxed sm:text-base",
                  isDark ? "text-white/75" : "text-slate"
                )}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
          {href && linkLabel ? (
            <Link
              href={href}
              className={cn(
                "hidden shrink-0 items-center gap-1 text-sm font-medium hover:underline sm:inline-flex",
                isDark ? "text-white/90 hover:text-white" : "text-sky-ink"
              )}
            >
              {linkLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}
