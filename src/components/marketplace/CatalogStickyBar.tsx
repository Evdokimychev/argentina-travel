"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { siteStickyBelowHeaderClass } from "@/lib/site-container";

type CatalogStickyBarProps = {
  children: ReactNode;
  className?: string;
  /** Negative horizontal margin to align with page container padding */
  inset?: boolean;
};

export default function CatalogStickyBar({
  children,
  className,
  inset = true,
}: CatalogStickyBarProps) {
  return (
    <div
      className={cn(
        "sticky z-30 border-b border-gray-100 bg-white/95 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-white/80",
        siteStickyBelowHeaderClass,
        inset && "-mx-4 px-4 sm:-mx-6 sm:px-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
