import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";

interface HeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  eyebrow?: string;
  ctaText?: string;
  ctaHref?: string;
  compact?: boolean;
  children?: ReactNode;
}

export default function Hero({
  title,
  subtitle,
  description,
  image,
  eyebrow,
  ctaText,
  ctaHref,
  compact = false,
  children,
}: HeroProps) {
  if (compact) {
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

        <div className={cn(siteContainerClass, "relative py-10 md:py-12 lg:py-14", children && "pb-8 md:pb-10")}>
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_min(38%,320px)] xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-12">
            <div className="min-w-0">
              {eyebrow ? (
                <span className="inline-flex rounded-full border border-sky/15 bg-sky/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky">
                  {eyebrow}
                </span>
              ) : null}

              <h1
                className={cn(
                  "max-w-2xl font-display text-3xl font-bold leading-[1.12] tracking-tight text-charcoal sm:text-4xl lg:text-[2.65rem]",
                  eyebrow && "mt-4"
                )}
              >
                {title}
              </h1>

              {subtitle ? (
                <p className="mt-3 max-w-xl text-base leading-relaxed text-slate sm:text-[1.05rem]">
                  {subtitle}
                </p>
              ) : null}

              {description ? (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate/90 sm:text-[0.95rem]">
                  {description}
                </p>
              ) : null}

              {ctaText && ctaHref ? (
                <Link
                  href={ctaHref}
                  className="mt-6 inline-flex rounded-full bg-sky px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-dark"
                >
                  {ctaText}
                </Link>
              ) : null}
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
                    alt=""
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

          {children ? <div className="mt-8 max-w-4xl lg:max-w-none">{children}</div> : null}
        </div>
      </section>
    );
  }

  return (
    <section
      data-scroll-rail-tone="dark"
      className="relative flex h-[85vh] min-h-[500px] items-end overflow-hidden"
    >
      <Image src={image} alt="" fill priority className="object-cover" sizes="100vw" />
      <div
        className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/45 to-charcoal/15"
        aria-hidden
      />
      <div className={cn(siteContainerClass, "relative z-10 pb-14 pt-28 sm:pb-16 sm:pt-32")}>
        {eyebrow ? (
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
            {eyebrow}
          </span>
        ) : null}
        <h1
          className={cn(
            "max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl",
            eyebrow && "mt-4"
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-lg text-white/85 sm:text-xl">{subtitle}</p>
        ) : null}
        {description ? (
          <p className="mt-2 max-w-2xl text-base text-white/70">{description}</p>
        ) : null}
        {ctaText && ctaHref ? (
          <Link
            href={ctaHref}
            className="mt-8 inline-flex rounded-full bg-sun px-8 py-3 text-base font-semibold text-charcoal transition-colors hover:bg-sun-dark"
          >
            {ctaText}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
