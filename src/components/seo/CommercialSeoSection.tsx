import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CommercialSeoCopy } from "@/lib/commercial-catalog-seo";
import { siteContainerClass } from "@/lib/site-container";

type CommercialSeoSectionProps = {
  copy: CommercialSeoCopy;
  className?: string;
};

export default function CommercialSeoSection({
  copy,
  className,
}: CommercialSeoSectionProps) {
  return (
    <section className={cn("border-t border-gray-100 bg-surface-muted/35 py-12 sm:py-16", className)}>
      <div className={siteContainerClass}>
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky">
            {copy.eyebrow}
          </p>
          <h2 className="mt-2 font-heading text-2xl font-bold text-charcoal sm:text-3xl">
            {copy.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate">{copy.description}</p>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {copy.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky/25 hover:shadow-card"
            >
              <span className="flex items-start justify-between gap-3 font-semibold text-charcoal">
                {link.title}
                <ArrowRight
                  className="mt-0.5 h-4 w-4 shrink-0 text-sky transition group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
              <span className="mt-2 block text-sm leading-relaxed text-slate">
                {link.description}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
