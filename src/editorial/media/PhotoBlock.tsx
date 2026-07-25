import Image from "next/image";
import { mediaUrl } from "@/lib/media/media-cdn";
import { cn } from "@/lib/cn";
import type { BlogEditorialDensity, BlogPhotoVariant } from "@/types/blog-content-blocks";

type Props = {
  src: string;
  alt: string;
  caption?: string;
  author?: string;
  sourceUrl?: string;
  license?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  variant?: BlogPhotoVariant;
  density?: BlogEditorialDensity;
};

export default function PhotoBlock({
  src,
  alt,
  caption,
  author,
  sourceUrl,
  license,
  priority = false,
  variant = "content-width",
  density = "comfortable",
}: Props) {
  if (!src.trim()) return null;

  const credit = [author, license].filter(Boolean).join(" · ");
  const aspect =
    variant === "portrait"
      ? "aspect-[3/4]"
      : variant === "landscape" || variant === "wide" || variant === "full-width"
        ? "aspect-[16/9]"
        : "aspect-[4/3]";

  return (
    <figure
      className={cn(
        "not-prose overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-surface-elevated",
        variant === "edge-to-edge" && "rounded-none border-x-0 sm:-mx-6",
        variant === "framed" && "ring-1 ring-charcoal/5",
        density === "compact" && "shadow-none",
      )}
      data-editorial-block="photo"
      data-variant={variant}
    >
      <div className={cn("relative w-full bg-surface-muted", aspect)}>
        <Image
          src={mediaUrl(src)}
          alt={alt || ""}
          fill
          className="object-cover"
          sizes={
            variant === "full-width" || variant === "edge-to-edge"
              ? "100vw"
              : "(max-width: 768px) 100vw, 720px"
          }
          priority={priority}
          loading={priority ? "eager" : "lazy"}
        />
      </div>
      {(caption || credit || sourceUrl) && (
        <figcaption
          className={cn(
            "space-y-1 px-3 text-xs text-slate dark:text-muted",
            density === "compact" ? "py-2" : "py-3",
          )}
        >
          {caption ? <span className="block leading-relaxed">{caption}</span> : null}
          {credit ? <span className="block text-[11px] opacity-80">{credit}</span> : null}
          {sourceUrl ? (
            <a
              href={sourceUrl}
              className="inline-flex min-h-11 items-center text-[11px] text-sky-ink underline-offset-2 hover:underline dark:text-sky"
              rel="noopener noreferrer"
              target="_blank"
            >
              Источник
            </a>
          ) : null}
        </figcaption>
      )}
    </figure>
  );
}
