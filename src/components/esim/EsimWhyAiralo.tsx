"use client";

import { ArrowUpDown, Globe2, QrCode, Smartphone } from "lucide-react";
import { useRevealAnimation } from "@/hooks/useRevealAnimation";
import { cn } from "@/lib/utils";

type EsimWhyAiraloProps = {
  title: string;
  items: [string, string, string, string];
};

const ICONS = [Globe2, ArrowUpDown, Smartphone, QrCode] as const;
const ITEM_DELAYS = ["", "animate-delay-100", "animate-delay-200", "animate-delay-300"] as const;

function revealClass(revealed: boolean, delay = "") {
  return cn(!revealed && "opacity-0", revealed && cn("animate-fade-in-up", delay));
}

export default function EsimWhyAiralo({ title, items }: EsimWhyAiraloProps) {
  const { ref, revealed } = useRevealAnimation();

  return (
    <section
      ref={ref}
      aria-labelledby="esim-why-airalo-title"
      className="mt-12 rounded-3xl bg-[#d9eef9] px-5 py-10 sm:px-8 sm:py-12 lg:px-10"
    >
      <h2
        id="esim-why-airalo-title"
        className={cn(
          "mx-auto max-w-3xl text-balance text-center font-heading text-xl font-bold leading-snug text-charcoal sm:text-2xl",
          revealClass(revealed)
        )}
      >
        {title}
      </h2>

      <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:mt-10 lg:grid-cols-4 lg:gap-6">
        {items.map((text, index) => {
          const Icon = ICONS[index] ?? Globe2;
          return (
            <li
              key={text}
              className={cn(
                "flex flex-col items-center text-center",
                revealClass(revealed, ITEM_DELAYS[index])
              )}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(26,26,46,0.08)]">
                <Icon className="h-6 w-6 text-charcoal" strokeWidth={1.5} aria-hidden />
              </span>
              <p className="mt-4 max-w-[240px] text-sm leading-relaxed text-charcoal">{text}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
