import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";
import type { GuidePillarHeroCta } from "@/types/guide-pillar";

type HubHeroEyebrow = {
  label: string;
  href?: string;
};

type HubHeroProps = {
  title: string;
  subtitle?: string;
  image: string;
  eyebrow?: HubHeroEyebrow;
  ctas?: GuidePillarHeroCta[];
  searchSlot?: React.ReactNode;
};

export default function HubHero({ title, subtitle, image, eyebrow, ctas, searchSlot }: HubHeroProps) {
  return (
    <section
      data-scroll-rail-tone="light"
      className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-surface-muted via-white to-sky/[0.06]"
    >
      <div
        className="pointer-events-none absolute -right-16 top-8 h-56 w-56 rounded-full bg-sky/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-sun/10 blur-3xl"
        aria-hidden
      />

      <div className={cn(siteContainerClass, "relative py-10 md:py-12 lg:py-14")}>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_min(38%,320px)] xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-12">
          <div className="min-w-0">
            {eyebrow ? (
              eyebrow.href ? (
                <Link
                  href={eyebrow.href}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-sky/15 bg-sky/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky transition-colors hover:border-sky/30 hover:bg-sky/10"
                >
                  {eyebrow.label}
                  <ArrowUpRight
                    className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              ) : (
                <span className="inline-flex rounded-full border border-sky/15 bg-sky/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky">
                  {eyebrow.label}
                </span>
              )
            ) : null}

            <h1 className="mt-4 max-w-2xl font-display text-3xl font-bold leading-[1.12] tracking-tight text-charcoal sm:text-4xl lg:text-[2.65rem]">
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-3 max-w-xl text-base leading-relaxed text-slate sm:text-[1.05rem]">
                {subtitle}
              </p>
            ) : null}

            {ctas && ctas.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {ctas.map((cta) => (
                  <Link
                    key={cta.href + cta.label}
                    href={cta.href}
                    target={cta.external ? "_blank" : undefined}
                    rel={cta.external ? "noopener noreferrer" : undefined}
                    className={cn(
                      buttonVariants({
                        variant:
                          cta.variant === "primary"
                            ? "default"
                            : cta.variant === "secondary"
                              ? "outline"
                              : "ghost",
                        size: "sm",
                      }),
                      "rounded-full px-4"
                    )}
                  >
                    {cta.label}
                  </Link>
                ))}
              </div>
            ) : null}

            {searchSlot}
          </div>

          <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
            <div
              className="pointer-events-none absolute -bottom-3 -left-3 hidden h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)] rounded-2xl border border-sky/20 lg:block"
              aria-hidden
            />
            <div className="relative overflow-hidden rounded-2xl bg-charcoal/5 shadow-card ring-1 ring-gray-100">
              <div className="relative aspect-[16/10] w-full sm:aspect-[5/3] lg:aspect-[4/3]">
                <Image
                  src={image}
                  alt={title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 360px"
                  className="object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-charcoal/25 via-transparent to-transparent"
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
