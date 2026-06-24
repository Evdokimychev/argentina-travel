"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
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

/** Coerce partner CDN objects (`{ src, host }`) and bare strings to a URL for next/image. */
function resolveImageSrc(src: ImageProps["src"]): ImageProps["src"] {
  if (typeof src === "string") {
    const trimmed = src.trim();
    return trimmed || "";
  }

  if (!src || typeof src !== "object" || !("src" in src)) return src;

  const record = src as { src?: string; host?: string };
  const raw = record.src?.trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  const host = record.host?.trim() || "cf.youtravel.me";
  return `https://${host.replace(/^\//, "")}/${raw.replace(/^\//, "")}`;
}

function hasIntrinsicDimensions(width: ImageProps["width"], height: ImageProps["height"]): boolean {
  const w = typeof width === "number" ? width : Number(width);
  const h = typeof height === "number" ? height : Number(height);
  return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0;
}

function aspectRatioStyle(width: ImageProps["width"], height: ImageProps["height"]): CSSProperties {
  return { aspectRatio: `${width} / ${height}` };
}

export function SafeImage({
  src,
  alt,
  className,
  placeholderVariant = "generic",
  placeholderLabel,
  placeholderCompact = false,
  fallback,
  blurPlaceholder = true,
  fill,
  width,
  height,
  ...props
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const resolvedSrc = resolveImageSrc(src);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [resolvedSrc]);

  const intrinsic = hasIntrinsicDimensions(width, height);
  const useBoundedShell = !fill && intrinsic;
  const useAbsolutePlaceholder = fill || useBoundedShell;

  const placeholderClassName = useAbsolutePlaceholder ? "absolute inset-0" : undefined;

  if (!resolvedSrc || failed) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const placeholder = (
      <ImagePlaceholder
        variant={placeholderVariant}
        label={placeholderLabel ?? alt}
        compact={placeholderCompact}
        className={cn(placeholderClassName, !useAbsolutePlaceholder && className)}
      />
    );

    if (useBoundedShell) {
      return (
        <div
          className="relative w-full"
          style={aspectRatioStyle(width, height)}
        >
          {placeholder}
        </div>
      );
    }

    return placeholder;
  }

  const showSkeleton = !loaded;

  const imageNode = (
    <>
      {showSkeleton ? (
        <ImagePlaceholder
          variant={placeholderVariant}
          compact={placeholderCompact}
          loading
          className={placeholderClassName}
        />
      ) : null}
      <Image
        src={resolvedSrc}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
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

  if (useBoundedShell) {
    return <div className="relative w-full">{imageNode}</div>;
  }

  return imageNode;
}
