"use client";

import DetailPhotoGallery from "@/components/shared/DetailPhotoGallery";
import { resolveKbMediaImages } from "@/lib/knowledge-base/media";
import type { KbMedia, KbMediaImage } from "@/lib/knowledge-base/types";

type KbMediaGalleryProps = {
  media: KbMedia;
  title: string;
};

function imageCredit(image: KbMediaImage) {
  const label = [image.author, image.license].filter(Boolean).join(", ");
  if (!label && !image.source_page) return null;

  const content = label || "Источник изображения";
  if (!image.source_page) return content;

  return (
    <a
      href={image.source_page}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-slate/30 underline-offset-2 hover:decoration-slate"
    >
      {content}
    </a>
  );
}

export function KbMediaGallery({ media, title }: KbMediaGalleryProps) {
  const images = resolveKbMediaImages(media);
  if (images.length === 0) return null;

  const creditedImages = images
    .map((image, index) => ({ image, index }))
    .filter(({ image }) => imageCredit(image));

  return (
    <figure className="mt-6">
      <DetailPhotoGallery
        images={images.map((image) => image.url)}
        title={title}
        altForImage={(index) => images[index]?.alt?.trim() || `${title} — фото ${index + 1}`}
        className="max-w-[46rem]"
      />
      {creditedImages.length > 0 ? (
        <figcaption className="mt-2 space-y-1 text-xs leading-relaxed text-slate">
          {creditedImages.map(({ image, index }) => (
            <span key={image.url} className="block">
              {images.length > 1 ? `Фото ${index + 1}: ` : "Фото: "}
              {imageCredit(image)}
            </span>
          ))}
        </figcaption>
      ) : (
        <figcaption className="sr-only">Фотографии: {title}</figcaption>
      )}
    </figure>
  );
}
