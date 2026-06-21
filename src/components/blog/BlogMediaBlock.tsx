import { SafeImage } from "@/components/ui/safe-image";
import { mediaUrl } from "@/lib/media-resolver";

type Props = {
  src: string;
  alt: string;
  caption?: string;
};

export default function BlogMediaBlock({ src, alt, caption }: Props) {
  if (!src.trim()) return null;

  return (
    <figure className="mx-auto max-w-prose overflow-hidden rounded-2xl bg-charcoal/5 ring-1 ring-gray-100">
      <div className="relative aspect-[16/10] w-full">
        <SafeImage
          src={mediaUrl(src)}
          alt={alt || caption || "Иллюстрация"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 720px"
        />
      </div>
      {caption ? (
        <figcaption className="border-t border-gray-100 px-4 py-2 text-xs text-slate">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
