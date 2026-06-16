import { CheckCircle2 } from "lucide-react";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/utils";

type InsuranceBenefitsProps = {
  title: string;
  items: string[];
  className?: string;
};

export default function InsuranceBenefits({ title, items, className }: InsuranceBenefitsProps) {
  return (
    <section
      className={cn(siteContainerClass, "py-10 sm:py-12", className)}
      aria-labelledby="insurance-benefits-title"
    >
      <h2
        id="insurance-benefits-title"
        className="font-heading text-xl font-bold text-charcoal sm:text-2xl"
      >
        {title}
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky" aria-hidden />
            <span className="text-sm leading-relaxed text-slate">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
