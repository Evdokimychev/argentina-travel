"use client";

import { SafeImage } from "@/components/ui/safe-image";
import type { ImageRole, ResolvedImage } from "@/lib/image-provider/types";
import { ROLE_SIZES } from "@/lib/image-provider/sizes";
import { cn } from "@/lib/cn";

type ResolvedImageProps = {
  image: ResolvedImage | string | { src: string; alt: string; title?: string };
  role?: ImageRole;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  /** Show Unsplash/Pexels attribution caption below image */
  showAttribution?: boolean;
};

function resolveInput(
  image: ResolvedImage | string | { src: string; alt: string; title?: string },
): ResolvedImage {
  if (typeof image === "string") {
    return {
      src: image,
      alt: "",
      title: "",
      attribution: { authorName: "", sourceUrl: "", license: "" },
    };
  }
  if ("attribution" in image) {
    return image;
  }
  return {
    src: image.src,
    alt: image.alt,
    title: image.title ?? image.alt,
    attribution: { authorName: "", sourceUrl: "", license: "" },
  };
}

function needsAttributionCaption(resolved: ResolvedImage): boolean {
  const src = resolved.attribution.source;
  if (src === "unsplash" || src === "pexels") return true;
  const html = resolved.attributionHtml ?? "";
  return /Unsplash|Pexels/.test(html);
}

export default function ResolvedImage({
  image,
  role = "card",
  className,
  fill,
  width,
  height,
  priority,
  sizes,
  showAttribution = false,
}: ResolvedImageProps) {
  const resolved = resolveInput(image);
  const isHero = role === "hero";
  const resolvedSizes = sizes ?? ROLE_SIZES[role];
  const caption =
    showAttribution && needsAttributionCaption(resolved) ? resolved.attributionHtml : null;

  const img = (
    <SafeImage
      src={resolved.src}
      alt={resolved.alt}
      title={resolved.title}
      fill={fill}
      width={width}
      height={height}
      priority={priority ?? isHero}
      loading={isHero ? undefined : "lazy"}
      sizes={resolvedSizes}
      className={cn(className)}
      placeholderVariant={role === "card" ? "tour" : "destination"}
      placeholderLabel={resolved.alt}
    />
  );

  if (!caption) return img;

  return (
    <figure className="space-y-2">
      {img}
      <figcaption
        className="text-xs text-slate/80"
        dangerouslySetInnerHTML={{ __html: caption }}
      />
    </figure>
  );
}
