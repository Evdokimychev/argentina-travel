"use client";

import { Download, Plane, QrCode } from "lucide-react";

type EsimHowItWorksProps = {
  title: string;
  steps: Array<{ title: string; description: string }>;
};

const STEP_ICONS = [Plane, Download, QrCode] as const;

export default function EsimHowItWorks({ title, steps }: EsimHowItWorksProps) {
  return (
    <section className="mt-8 rounded-2xl border border-sky/10 bg-gradient-to-br from-sky/[0.04] via-white to-surface-muted p-5 sm:p-6">
      <h2 className="font-heading text-lg font-bold text-charcoal">{title}</h2>
      <ol className="mt-4 grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? Plane;
          return (
            <li key={step.title} className="rounded-xl bg-white/80 p-4 ring-1 ring-gray-100">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky/10 text-sky">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-3 font-medium text-charcoal">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate">{step.description}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
