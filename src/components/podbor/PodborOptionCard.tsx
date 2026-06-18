"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/cn";
import type { PodborOption } from "@/types/podbor";

interface PodborOptionCardProps {
  option: PodborOption;
  selected: boolean;
  selectionMode: "single" | "multi";
  onSelect: () => void;
  index: number;
}

export default function PodborOptionCard({
  option,
  selected,
  selectionMode,
  onSelect,
  index,
}: PodborOptionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border text-left shadow-card transition-shadow duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2",
        selected
          ? "border-sky/50 ring-2 ring-sky/20"
          : "border-gray-100 hover:border-sky/25 hover:shadow-md"
      )}
    >
      {option.image ? (
        <div className="relative aspect-[16/10] overflow-hidden sm:aspect-[2/1]">
          <SafeImage
            src={option.image}
            alt=""
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 480px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/55 via-charcoal/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
            <p className="font-heading text-lg font-bold leading-snug text-white sm:text-xl">
              {option.label}
            </p>
            {option.description ? (
              <p className="mt-1 text-sm leading-relaxed text-white/85">{option.description}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5">
          <p className="font-heading text-base font-bold text-charcoal sm:text-lg">
            {option.label}
          </p>
          {option.description ? (
            <p className="mt-1 text-sm text-slate">{option.description}</p>
          ) : null}
        </div>
      )}

      <span
        className={cn(
          "absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border transition-colors",
          selected
            ? "border-sky bg-sky text-white"
            : "border-white/70 bg-white/90 text-transparent backdrop-blur-sm"
        )}
        aria-hidden
      >
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </span>

      {selectionMode === "multi" ? (
        <span className="sr-only">{selected ? "Выбрано" : "Не выбрано"}</span>
      ) : null}
    </motion.button>
  );
}
