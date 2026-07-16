import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/cn";
import type { BlogImageTextPosition } from "@/types/blog-content-blocks";

type Props = {
  src: string;
  alt: string;
  title: string;
  body: string;
  imagePosition?: BlogImageTextPosition;
  caption?: string;
};

export default function BlogImageTextBlock({
  src,
  alt,
  title,
  body,
  imagePosition = "left",
  caption,
}: Props) {
  if (!title.trim() && !body.trim() && !src.trim()) return null;

  return (
    <section className="grid overflow-hidden rounded-[1.75rem] border border-sky/15 bg-white shadow-sm md:grid-cols-2">
      <figure
        className={cn(
          "relative min-h-[15rem] overflow-hidden bg-surface-muted md:min-h-[22rem]",
          imagePosition === "right" && "md:order-2"
        )}
      >
        <SafeImage
          src={src}
          alt={alt || title || "Фотография из путешествия"}
          fill
          className="object-cover"
          sizes="(max-width: 767px) 100vw, 50vw"
          placeholderVariant="destination"
          preferLocalMedia
        />
        {caption ? (
          <figcaption className="absolute inset-x-3 bottom-3 rounded-full bg-charcoal/75 px-3 py-1.5 text-center text-xs leading-snug text-white backdrop-blur-sm">
            {caption}
          </figcaption>
        ) : null}
      </figure>

      <div className="flex flex-col justify-center px-5 py-7 sm:px-7 sm:py-9 lg:px-10">
        {title ? (
          <h3 className="font-display text-2xl font-semibold leading-tight tracking-[-0.02em] text-charcoal sm:text-3xl">
            {title}
          </h3>
        ) : null}
        {body ? (
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate sm:text-base">
            {body}
          </p>
        ) : null}
      </div>
    </section>
  );
}
