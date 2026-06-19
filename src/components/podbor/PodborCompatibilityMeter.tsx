"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface PodborCompatibilityMeterProps {
  value: number;
  className?: string;
}

export default function PodborCompatibilityMeter({
  value,
  className,
}: PodborCompatibilityMeterProps) {
  const spring = useSpring(0, { stiffness: 60, damping: 18 });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  const width = useTransform(spring, (v) => `${v}%`);
  const display = useTransform(spring, (v) => `${Math.round(v)}%`);

  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate">Индекс совместимости</p>
          <motion.p className="font-heading text-4xl font-bold text-charcoal sm:text-5xl">
            {display}
          </motion.p>
        </div>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
        <motion.div
          style={{ width }}
          className="h-full rounded-full bg-gradient-to-r from-sky via-sky-dark to-patagonia"
        />
      </div>
    </div>
  );
}
