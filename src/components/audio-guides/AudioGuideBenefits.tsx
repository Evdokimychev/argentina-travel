"use client";

import { Headphones, MapPin, Smartphone, WifiOff } from "lucide-react";
import { useRevealAnimation } from "@/hooks/useRevealAnimation";
import { cn } from "@/lib/utils";

type AudioGuideBenefitsProps = {
  title: string;
  items: [string, string, string, string];
};

const ICONS = [Headphones, Smartphone, MapPin, WifiOff] as const;

export default function AudioGuideBenefits({ title, items }: AudioGuideBenefitsProps) {
  const { ref, revealed } = useRevealAnimation();

  return (
    <section
      ref={ref}
      aria-labelledby="audio-guide-benefits-title"
      className="mt-12 rounded-3xl border border-gray-100 bg-white px-5 py-10 shadow-card sm:px-8"
    >
      <h2 id="audio-guide-benefits-title" className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
        {title}
      </h2>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((text, index) => {
          const Icon = ICONS[index] ?? Headphones;
          return (
            <li key={text} className={cn(!revealed && "opacity-0", revealed && "animate-fade-in-up")}>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky/10 text-sky">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <p className="mt-3 text-sm leading-relaxed text-slate">{text}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
