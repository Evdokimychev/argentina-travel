"use client";

import { SafeImage } from "@/components/ui/safe-image";
import type { ImageRole, ResolvedImage } from "@/lib/image-provider/types";
import { ROLE_SIZES } from "@/lib/image-provider/sizes";
import { cn } from "@/lib/cn";

type PageImageProps = {
  image: ResolvedImage | string | { src: string; alt: string; title?: string };
  role?: ImageRole;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  loading?: "lazy" | "eager";
  sizes?: string;
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

export default function PageImage({
  image,
  role = "card",
  className,
  fill,
  width,
  height,
  priority,
  loading,
  sizes,
}: PageImageProps) {
  const resolved = resolveInput(image);
  const isHero = role === "hero";
  const resolvedSizes = sizes ?? ROLE_SIZES[role];
  const resolvedPriority = priority ?? isHero;
  const resolvedLoading = loading ?? (resolvedPriority ? undefined : "lazy");

  return (
    <SafeImage
      src={resolved.src}
      alt={resolved.alt}
      title={resolved.title}
      fill={fill}
      width={width}
      height={height}
      priority={resolvedPriority}
      fetchPriority={resolvedPriority ? "high" : undefined}
      loading={resolvedLoading}
      sizes={resolvedSizes}
      className={cn(className)}
      placeholderVariant="generic"
    />
  );
}
