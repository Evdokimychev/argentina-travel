import Image from "next/image";
import Link from "next/link";
import { mediaUrl } from "@/lib/media/media-cdn";
import { cn } from "@/lib/cn";
import type { BlogEditorialDensity } from "@/types/blog-content-blocks";

type Props = {
  eyebrow?: string;
  title: string;
  lede?: string;
  imageSrc?: string;
  imageAlt?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  density?: BlogEditorialDensity;
};

export default function HeroBannerBlock({
  eyebrow,
  title,
  lede,
  imageSrc,
  imageAlt,
  primaryCta,
  secondaryCta,
  density = "comfortable",
}: Props) {
  if (!title.trim()) return null;

  return (
    <section
      className={cn(
        "not-prose relative overflow-hidden rounded-2xl border border-gray-100 bg-charcoal text-white dark:border-white/10",
        density === "compact" ? "min-h-[220px]" : "min-h-[280px] sm:min-h-[320px]",
      )}
      data-editorial-block="hero-banner"
    >
      {imageSrc ? (
        <Image
          src={mediaUrl(imageSrc)}
          alt={imageAlt || ""}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 960px"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-sky/40 via-charcoal to-charcoal" aria-hidden />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/45 to-charcoal/20" />
      <div
        className={cn(
          "relative flex h-full flex-col justify-end",
          density === "compact" ? "p-4 sm:p-5" : "p-5 sm:p-8",
        )}
      >
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">{title}</h2>
        {lede ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">{lede}</p> : null}
        {(primaryCta || secondaryCta) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {primaryCta?.href && primaryCta.label ? (
              <Link
                href={primaryCta.href}
                className="inline-flex min-h-11 items-center rounded-xl bg-sky px-4 text-sm font-semibold text-charcoal"
              >
                {primaryCta.label}
              </Link>
            ) : null}
            {secondaryCta?.href && secondaryCta.label ? (
              <Link
                href={secondaryCta.href}
                className="inline-flex min-h-11 items-center rounded-xl border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-sm"
              >
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
