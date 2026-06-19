"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { PodborRegionResult } from "@/types/podbor";
import { destinationHref } from "@/lib/destinations";

/** Стилизованная SVG-карта Аргентины с маркерами регионов. */
export default function PodborRegionMap({
  regions,
  className,
}: {
  regions: PodborRegionResult[];
  className?: string;
}) {
  const highlighted = new Set(regions.map((r) => r.id));

  const markers = regions.map((region, index) => (
    <motion.g
      key={region.id}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 + index * 0.12, type: "spring", stiffness: 220, damping: 18 }}
    >
      <circle
        cx={`${region.mapX}%`}
        cy={`${region.mapY}%`}
        r="10"
        className="fill-sky/25"
      />
      <circle
        cx={`${region.mapX}%`}
        cy={`${region.mapY}%`}
        r="5"
        className="fill-sky"
      />
      <text
        x={`${region.mapX}%`}
        y={`${Math.max(region.mapY - 4, 8)}%`}
        textAnchor="middle"
        className="fill-charcoal text-[9px] font-semibold sm:text-[10px]"
      >
        {index + 1}
      </text>
    </motion.g>
  ));

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-pampas to-white p-4 shadow-card",
        className
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className="mx-auto h-auto w-full max-w-md"
        aria-label="Карта Аргентины с рекомендованными регионами"
      >
        <path
          d="M48 8 L58 12 L62 18 L68 22 L72 30 L74 38 L70 46 L66 54 L62 62 L58 72 L54 82 L50 90 L46 92 L42 86 L38 76 L34 66 L30 54 L28 42 L32 30 L36 20 L42 12 Z"
          className={cn(
            "fill-white stroke-gray-200",
            highlighted.size > 0 && "fill-sky/5"
          )}
          strokeWidth="0.6"
        />
        {markers}
      </svg>

      <ul className="mt-4 space-y-2">
        {regions.map((region, index) => (
          <li key={region.id}>
            <Link
              href={destinationHref(region.slug)}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors hover:bg-sky/5"
            >
              <span className="font-medium text-charcoal">
                {index + 1}. {region.name}
              </span>
              <span className="text-xs text-slate">{region.score} б.</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
