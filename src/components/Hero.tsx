import Link from "next/link";

interface HeroProps {
  title: string;
  subtitle?: string;
  image: string;
  ctaText?: string;
  ctaHref?: string;
  overlay?: boolean;
  compact?: boolean;
}

export default function Hero({
  title,
  subtitle,
  image,
  ctaText,
  ctaHref,
  overlay = true,
  compact = false,
}: HeroProps) {
  return (
    <section
      className={`relative flex items-center justify-center overflow-hidden ${compact ? "h-[40vh] min-h-[280px]" : "h-[85vh] min-h-[500px]"}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
      />
      {overlay && <div className="absolute inset-0 gradient-hero" />}
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center text-white">
        <h1
          className={`font-display font-bold leading-tight ${compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl lg:text-6xl"} animate-fade-in-up opacity-0`}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 text-lg sm:text-xl text-white/90 animate-fade-in-up animate-delay-100 opacity-0 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
        {ctaText && ctaHref && (
          <Link
            href={ctaHref}
            className="mt-8 inline-block rounded-full bg-sun px-8 py-3 text-base font-semibold text-charcoal transition-colors hover:bg-sun-dark animate-fade-in-up animate-delay-200 opacity-0"
          >
            {ctaText}
          </Link>
        )}
      </div>
    </section>
  );
}
