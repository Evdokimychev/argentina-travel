"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useRevealAnimation } from "@/hooks/useRevealAnimation";
import { cn } from "@/lib/utils";

export type CarRentalFaqItem = {
  question: string;
  answer: string;
};

type CarRentalFaqSectionProps = {
  title: string;
  items: CarRentalFaqItem[];
};

const ITEM_DELAYS = ["", "animate-delay-100", "animate-delay-200", "animate-delay-300"] as const;

function revealClass(revealed: boolean, delay = "") {
  return cn(!revealed && "opacity-0", revealed && cn("animate-fade-in-up", delay));
}

export default function CarRentalFaqSection({ title, items }: CarRentalFaqSectionProps) {
  const { ref, revealed } = useRevealAnimation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      ref={ref}
      aria-labelledby="car-rental-faq-title"
      className={cn(
        "mt-12 overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_24px_rgba(26,26,46,0.06)] sm:p-8",
        revealClass(revealed)
      )}
    >
      <h2
        id="car-rental-faq-title"
        className="font-heading text-xl font-bold text-charcoal sm:text-2xl"
      >
        {title}
      </h2>

      <div className="mt-6 space-y-3">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          const panelId = `car-rental-faq-panel-${index}`;
          const buttonId = `car-rental-faq-button-${index}`;

          return (
            <div
              key={item.question}
              className={cn(
                "overflow-hidden rounded-2xl border border-gray-100 bg-white transition-colors duration-200 hover:border-[#FFB347]/70",
                revealClass(revealed, ITEM_DELAYS[index])
              )}
            >
              <button
                id={buttonId}
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-medium text-charcoal">{item.question}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-slate transition-transform duration-300 motion-reduce:transition-none",
                    isOpen && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={cn(
                  "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm leading-relaxed text-slate">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
