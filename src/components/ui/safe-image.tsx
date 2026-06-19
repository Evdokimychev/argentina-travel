"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image, { type ImageProps } from "next/image";
import { ImagePlaceholder, type ImagePlaceholderVariant } from "@/components/ui/image-placeholder";
import { SKY_IMAGE_BLUR_DATA_URL } from "@/lib/media-blur";
import { cn } from "@/lib/cn";

type SafeImageProps = Omit<ImageProps, "onError" | "onLoad" | "placeholder"> & {
  placeholderVariant?: ImagePlaceholderVariant;
  placeholderLabel?: string;
  placeholderCompact?: boolean;
  fallback?: ReactNode;
  blurPlaceholder?: boolean;
};

export function SafeImage({
  src,
  alt,
  className,
  placeholderVariant = "generic",
  placeholderLabel,
  placeholderCompact = false,
  fallback,
  blurPlaceholder = true,
  ...props
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const resolvedSrc = typeof src === "string" ? src.trim() : src;

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [resolvedSrc]);

  if (!resolvedSrc || failed) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <ImagePlaceholder
        variant={placeholderVariant}
        label={placeholderLabel ?? alt}
        compact={placeholderCompact}
        className={cn("absolute inset-0", className)}
      />
    );
  }

  const showSkeleton = !loaded;

  return (
    <>
      {showSkeleton ? (
        <ImagePlaceholder
          variant={placeholderVariant}
          compact={placeholderCompact}
          loading
          className="absolute inset-0"
        />
      ) : null}
      <Image
        src={resolvedSrc}
        alt={alt}
        className={cn(
          className,
          showSkeleton && "opacity-0",
          !showSkeleton && "opacity-100 transition-opacity duration-300",
        )}
        placeholder={blurPlaceholder ? "blur" : undefined}
        blurDataURL={blurPlaceholder ? SKY_IMAGE_BLUR_DATA_URL : undefined}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        {...props}
      />
    </>
  );
}
