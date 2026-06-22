"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  tokenCardInteractiveClass,
  tokenCardSurfaceClass,
  tokenFocusRingClass,
} from "@/lib/design-tokens";

/** Card corner radius — matches `--radius-card` / `--radius-panel` tokens. */
export type ContentCardRadius = "card" | "panel";

const radiusClass: Record<ContentCardRadius, string> = {
  card: "rounded-card",
  panel: "rounded-panel",
};

const panelShellClass =
  "rounded-panel border border-border-subtle bg-surface-elevated shadow-card transition-shadow hover:shadow-elevated motion-reduce:transition-none";

/** Shared catalog card shell (blog / tour / excursion). */
export function contentCardShellClass({
  radius = "card",
  interactive = true,
}: {
  radius?: ContentCardRadius;
  interactive?: boolean;
} = {}) {
  return cn(
    "group relative flex h-full flex-col overflow-hidden",
    radius === "panel" ? panelShellClass : cn("overflow-hidden", tokenCardSurfaceClass),
    interactive && tokenCardInteractiveClass,
  );
}

export type ContentCardProps = React.ComponentProps<"article"> & {
  radius?: ContentCardRadius;
  interactive?: boolean;
};

/** Root shell for public catalog cards. */
export function ContentCard({
  radius = "card",
  interactive = true,
  className,
  children,
  ...props
}: ContentCardProps) {
  return (
    <article className={cn(contentCardShellClass({ radius, interactive }), className)} {...props}>
      {children}
    </article>
  );
}

export function ContentCardOverlayLink({
  href,
  ariaLabel,
  radius = "card",
  className,
}: {
  href: string;
  ariaLabel: string;
  radius?: ContentCardRadius;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "absolute inset-0 z-0",
        radiusClass[radius],
        tokenFocusRingClass,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2",
        className,
      )}
      aria-label={ariaLabel}
    />
  );
}

export function ContentCardMedia({
  aspect = "4/3",
  gradient = "bottom",
  className,
  children,
}: {
  aspect?: "4/3" | "16/10" | "auto";
  gradient?: "bottom" | "featured" | "none";
  className?: string;
  children: React.ReactNode;
}) {
  const aspectClass =
    aspect === "4/3" ? "aspect-[4/3]" : aspect === "16/10" ? "aspect-[16/10]" : "";

  const gradientClass =
    gradient === "bottom"
      ? "from-charcoal/25 via-transparent to-transparent"
      : gradient === "featured"
        ? "from-charcoal/30 via-charcoal/5 to-transparent"
        : null;

  return (
    <div className={cn("relative overflow-hidden bg-surface-muted", aspectClass, className)}>
      {children}
      {gradientClass ? (
        <div
          className={cn("pointer-events-none absolute inset-0 bg-gradient-to-t", gradientClass)}
          aria-hidden
        />
      ) : null}
    </div>
  );
}

/** Hover scale for card cover images — disabled globally under prefers-reduced-motion. */
export const contentCardMediaHoverClass =
  "content-card-media-hover object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none";

export function ContentCardBadges({
  className,
  children,
  inset = "standard",
}: {
  className?: string;
  children: React.ReactNode;
  inset?: "standard" | "featured" | "wide";
}) {
  const insetClass =
    inset === "featured"
      ? "absolute inset-x-4 top-4 z-10"
      : inset === "wide"
        ? "absolute inset-x-3 top-3 z-10"
        : "absolute left-3 top-3 z-10";

  return (
    <div
      className={cn(
        "pointer-events-none flex flex-wrap items-start gap-2",
        insetClass,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ContentCardBody({
  className,
  children,
  pointerEvents = "none",
  padding = "catalog",
}: {
  className?: string;
  children: React.ReactNode;
  pointerEvents?: "none" | "auto";
  padding?: "catalog" | "blog";
}) {
  const paddingClass = padding === "blog" ? "p-5 sm:p-6" : "p-4";

  return (
    <div
      className={cn(
        "relative z-10 flex flex-1 flex-col",
        paddingClass,
        pointerEvents === "none" && "pointer-events-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ContentCardTitle({
  as: Tag = "h3",
  className,
  children,
}: {
  as?: "h2" | "h3";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "font-heading font-bold leading-snug text-charcoal transition-colors group-hover:text-sky",
        Tag === "h2" ? "mt-3 text-2xl leading-snug sm:text-3xl" : "mt-2 line-clamp-2 text-lg",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function ContentCardMeta({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate", className)}>
      {children}
    </div>
  );
}
