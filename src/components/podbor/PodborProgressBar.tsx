"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface PodborProgressBarProps {
  percent: number;
  current: number;
  total: number;
}

export default function PodborProgressBar({
  percent,
  current,
  total,
}: PodborProgressBarProps) {
  return (
    <div className="sticky top-0 z-20 border-b border-gray-100/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
        <div className="mb-2 flex items-center justify-between text-xs text-slate">
          <span className="font-medium text-charcoal">Подбор маршрута</span>
          <span>
            {current} / {total}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <motion.div
            className={cn("h-full rounded-full bg-gradient-to-r from-sky to-sky-dark")}
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </div>
  );
}
