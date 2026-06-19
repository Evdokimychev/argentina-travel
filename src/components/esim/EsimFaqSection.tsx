"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useRevealAnimation } from "@/hooks/useRevealAnimation";
import { cn } from "@/lib/utils";

export type EsimFaqItem = {
  question: string;
  answer: string;
};

type EsimFaqSectionProps = {
  title: string;
  helpCenterLabel: string;
  helpCenterUrl: string;
  items: EsimFaqItem[];
  support: {
    title: string;
    description: string;
    whatsappLabel: string;
    whatsappUrl: string;
  };
};

const ITEM_DELAYS = ["", "animate-delay-100", "animate-delay-200", "animate-delay-300"] as const;

function revealClass(revealed: boolean, delay = "") {
  return cn(!revealed && "opacity-0", revealed && cn("animate-fade-in-up", delay));
}

export default function EsimFaqSection({
  title,
  helpCenterLabel,
  helpCenterUrl,
  items,
  support,
}: EsimFaqSectionProps) {
  const { ref, revealed } = useRevealAnimation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      ref={ref}
      aria-labelledby="esim-faq-title"
      className={cn(
        "mt-12 overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_24px_rgba(26,26,46,0.06)] sm:p-8",
        revealClass(revealed)
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h2
          id="esim-faq-title"
          className="font-heading text-xl font-bold text-charcoal sm:text-2xl"
        >
          {title}
        </h2>
        <a
          href={helpCenterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "shrink-0 rounded-full border-gray-200 px-5 text-sm font-medium text-charcoal hover:border-[#FFB347] hover:bg-[#FFB347]/5"
          )}
        >
          {helpCenterLabel}
          <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
        </a>
      </div>

      <div className="mt-6 space-y-3">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          const panelId = `esim-faq-panel-${index}`;
          const buttonId = `esim-faq-button-${index}`;

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

      <div
        className={cn(
          "mt-8 border-t border-gray-100 pt-8",
          revealClass(revealed, "animate-delay-500")
        )}
      >
        <h3 className="font-heading text-lg font-bold text-charcoal">{support.title}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">{support.description}</p>
        <a
          href={support.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-5 inline-flex rounded-full border-gray-200 px-5 text-sm font-medium text-charcoal hover:border-[#FFB347] hover:bg-[#FFB347]/5"
          )}
        >
          {support.whatsappLabel}
        </a>
      </div>
    </section>
  );
}
