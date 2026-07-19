"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Image, { type ImageProps } from "next/image";
import {
  ImagePlaceholder,
  IMAGE_PLACEHOLDER_LABEL,
  type ImagePlaceholderVariant,
} from "@/components/ui/image-placeholder";
import { SKY_IMAGE_BLUR_DATA_URL } from "@/lib/media-blur";
import { buildPartnerImageProxyUrl } from "@/lib/media/partner-image-proxy";
import { cn } from "@/lib/cn";

type SafeImageProps = Omit<ImageProps, "onError" | "onLoad" | "placeholder"> & {
  placeholderVariant?: ImagePlaceholderVariant;
  placeholderLabel?: string;
  placeholderCompact?: boolean;
  fallback?: ReactNode;
  blurPlaceholder?: boolean;
  /** Prefer the bundled /public copy for curated media that is also mirrored on the CDN. */
  preferLocalMedia?: boolean;
  partnerImageWidth?: number;
  partnerImageQuality?: number;
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

function localMediaFallback(src: ImageProps["src"]): string | null {
  if (typeof src !== "string" || !/^https?:\/\//i.test(src)) return null;

  try {
    const pathname = new URL(src).pathname;
    const mediaIndex = pathname.indexOf("/media/");
    return mediaIndex >= 0 ? pathname.slice(mediaIndex) : null;
  } catch {
    return null;
  }
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
  preferLocalMedia = false,
  partnerImageWidth,
  partnerImageQuality,
  fill,
  width,
  height,
  unoptimized,
  ...props
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [retrySrc, setRetrySrc] = useState<string | null>(null);
  const resolvedSrc = resolveImageSrc(src);
  const preferredLocalSrc = preferLocalMedia ? localMediaFallback(resolvedSrc) : null;
  const activeSrc = retrySrc ?? preferredLocalSrc ?? resolvedSrc;
  const deliverySrc =
    typeof activeSrc === "string"
      ? buildPartnerImageProxyUrl(activeSrc, {
          width: partnerImageWidth,
          quality: partnerImageQuality,
        })
      : activeSrc;
  const isPartnerProxyDelivery =
    typeof deliverySrc === "string" && deliverySrc.startsWith("/api/media/partner-image?");

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
    setRetrySrc(null);
  }, [resolvedSrc]);

  const intrinsic = hasIntrinsicDimensions(width, height);
  const useBoundedShell = !fill && intrinsic;
  const useAbsolutePlaceholder = fill || useBoundedShell;

  const placeholderClassName = useAbsolutePlaceholder ? "absolute inset-0" : undefined;

  if (!deliverySrc || failed) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const placeholder = (
      <ImagePlaceholder
        variant={placeholderVariant}
        label={placeholderLabel ?? IMAGE_PLACEHOLDER_LABEL}
        ariaLabel={alt}
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

  // next/image already paints the blur placeholder immediately. Keeping our
  // branded skeleton above it made large editorial heroes flash the logo and
  // look like broken media while the optimizer was still working.
  const showSkeleton = !loaded && !blurPlaceholder;

  const imageNode = (
    <>
      {showSkeleton ? (
        <ImagePlaceholder
          variant={placeholderVariant}
          compact
          loading
          decorative
          className={placeholderClassName}
        />
      ) : null}
      <Image
        src={deliverySrc}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        unoptimized={isPartnerProxyDelivery || unoptimized}
        className={cn(
          className,
          showSkeleton && "opacity-0",
          !showSkeleton && "opacity-100 transition-opacity duration-300",
        )}
        placeholder={blurPlaceholder ? "blur" : undefined}
        blurDataURL={blurPlaceholder ? SKY_IMAGE_BLUR_DATA_URL : undefined}
        onLoad={() => setLoaded(true)}
        onError={() => {
          const localFallback = localMediaFallback(resolvedSrc);
          if (localFallback && activeSrc !== localFallback) {
            setLoaded(false);
            setRetrySrc(localFallback);
            return;
          }
          setFailed(true);
        }}
        {...props}
      />
    </>
  );

  if (useBoundedShell) {
    return <div className="relative w-full">{imageNode}</div>;
  }

  return imageNode;
}
