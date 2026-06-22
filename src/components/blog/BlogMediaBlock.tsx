import { SafeImage } from "@/components/ui/safe-image";
import { contentFigureShellClass, contentFigureDimensions, CONTENT_FIGURE_SIZES } from "@/lib/content-figure";
import { mediaUrl } from "@/lib/media-resolver";

type Props = {
  src: string;
  alt: string;
  caption?: string;
};

export default function BlogMediaBlock({ src, alt, caption }: Props) {
  if (!src.trim()) return null;
  const dims = contentFigureDimensions();

  return (
    <figure className={contentFigureShellClass}>
      <SafeImage
        src={mediaUrl(src)}
        alt={alt || caption || "Иллюстрация"}
        width={dims.width}
        height={dims.height}
        className="block h-auto w-full"
        sizes={CONTENT_FIGURE_SIZES}
        placeholderVariant="destination"
        placeholderLabel={alt || caption || "Иллюстрация"}
        blurPlaceholder={false}
      />
      {caption ? (
        <figcaption className="border-t border-gray-100 px-4 py-2 text-xs text-slate">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
