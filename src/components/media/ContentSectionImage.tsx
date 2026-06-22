import PageImage from "@/components/media/PageImage";
import { getContentImage, hasContentSlotImage } from "@/lib/media-resolver";
import type { ResolvedImage } from "@/lib/image-provider/types";
import {
  contentFigureShellClass,
  contentFigureDimensions,
  CONTENT_FIGURE_SIZES,
} from "@/lib/content-figure";
import { cn } from "@/lib/cn";

function figureDimensions(resolved: ResolvedImage) {
  return contentFigureDimensions(resolved);
}

function needsAttributionCaption(resolved: ResolvedImage): boolean {
  const source = resolved.attribution.source;
  if (source === "unsplash" || source === "pexels") return true;
  const html = resolved.attributionHtml ?? "";
  return /Unsplash|Pexels/.test(html);
}

type ContentSectionImageProps = {
  image: ResolvedImage | string;
  caption?: string;
  role?: "content" | "section";
  className?: string;
  /** @deprecated Intrinsic sizing is default; only pass to force a cropped aspect box. */
  aspectClassName?: string;
};

export default function ContentSectionImage({
  image,
  caption,
  role = "content",
  className,
  aspectClassName,
  priority,
  loading,
}: ContentSectionImageProps & {
  priority?: boolean;
  loading?: "lazy" | "eager";
}) {
  const resolved = typeof image === "string" ? getContentImage("service:home", image) : image;
  const attributionHtml =
    needsAttributionCaption(resolved) ? resolved.attributionHtml : undefined;
  const dims = figureDimensions(resolved);
  const useCropBox = Boolean(aspectClassName);

  return (
    <figure className={cn(contentFigureShellClass, className)}>
      {useCropBox ? (
        <div className={cn("relative w-full", aspectClassName)}>
          <PageImage
            image={resolved}
            role={role}
            fill
            className="object-cover"
            priority={priority}
            loading={loading}
            sizes={CONTENT_FIGURE_SIZES}
          />
        </div>
      ) : (
        <PageImage
          image={resolved}
          role={role}
          width={dims.width}
          height={dims.height}
          className="block h-auto w-full"
          priority={priority}
          loading={loading}
          sizes={CONTENT_FIGURE_SIZES}
        />
      )}
      {caption ? (
        <figcaption className="px-4 py-3 text-sm leading-relaxed text-slate">{caption}</figcaption>
      ) : (
        <figcaption className="sr-only">{resolved.alt}</figcaption>
      )}
      {attributionHtml ? (
        <figcaption
          className="border-t border-gray-100 px-4 py-2 text-xs text-slate/70"
          dangerouslySetInnerHTML={{ __html: attributionHtml }}
        />
      ) : null}
    </figure>
  );
}

type PageSlotImageProps = {
  pageId: string;
  slotId: string;
  caption?: string;
  role?: "content" | "section";
  className?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
};

export function PageSlotImage({
  pageId,
  slotId,
  caption,
  role,
  className,
  priority,
  loading,
}: PageSlotImageProps) {
  if (!hasContentSlotImage(pageId, slotId)) return null;

  const image = getContentImage(pageId, slotId);
  return (
    <ContentSectionImage
      image={image}
      caption={caption}
      role={role}
      className={className}
      priority={priority}
      loading={loading}
    />
  );
}
