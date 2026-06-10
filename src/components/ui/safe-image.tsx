"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { ImagePlaceholder, type ImagePlaceholderVariant } from "@/components/ui/image-placeholder";
import { cn } from "@/lib/cn";

type SafeImageProps = Omit<ImageProps, "onError"> & {
  placeholderVariant?: ImagePlaceholderVariant;
  placeholderLabel?: string;
};

export function SafeImage({
  src,
  alt,
  className,
  placeholderVariant = "generic",
  placeholderLabel,
  ...props
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = typeof src === "string" ? src.trim() : src;

  if (!resolvedSrc || failed) {
    return (
      <ImagePlaceholder
        variant={placeholderVariant}
        label={placeholderLabel ?? alt}
        className={cn("absolute inset-0", className)}
      />
    );
  }

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
