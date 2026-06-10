"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { siteScrollAnchorClass } from "@/lib/site-container";

type HubSectionProps = {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export default function HubSection({ id, title, subtitle, children, className }: HubSectionProps) {
  return (
    <section
      id={id}
      className={cn(siteScrollAnchorClass, "rounded-3xl border border-gray-100 bg-white p-6 shadow-card sm:p-8", className)}
    >
      <header className="mb-6 border-b border-gray-100 pb-4">
        <h2 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}
