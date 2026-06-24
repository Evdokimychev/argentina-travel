"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2, Info } from "lucide-react";
import { ComfortDotRating } from "@/components/marketplace/sidebar-filter-ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TourSection from "./TourSection";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import type { TourAccommodation, TourDetail } from "@/types";
import { tourDetailCardBorderClass, tourDetailInsetMutedClass } from "@/lib/tour-detail-ui";
import { cn } from "@/lib/cn";

function AccommodationPhotoStrip({
  images,
  onOpenGallery,
}: {
  images: string[];
  onOpenGallery: () => void;
}) {
  if (!images.length) return null;

  const visible = images.slice(0, 3);
  const remaining = Math.max(images.length - 3, 0);

  return (
    <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
      {visible.map((src, index) => {
        const isLast = index === visible.length - 1;
        const showOverlay = isLast && remaining > 0;

        return (
          <button
            key={`${src}-${index}`}
            type="button"
            onClick={onOpenGallery}
            className={cn(
              "relative aspect-[5/4] overflow-hidden rounded-xl bg-gray-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
            )}
            aria-label={
              showOverlay
                ? `Показать все фото проживания, ещё ${remaining}`
                : `Фото проживания ${index + 1}`
            }
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 200px"
            />
            {showOverlay ? (
              <span className="absolute inset-0 flex items-center justify-center bg-charcoal/45 text-lg font-semibold text-white">
                + {remaining}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function AccommodationGalleryDialog({
  images,
  title,
  open,
  onOpenChange,
}: {
  images: string[];
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid max-h-[70vh] gap-3 overflow-y-auto sm:grid-cols-2">
          {images.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100"
            >
              <Image
                src={src}
                alt={`Фото проживания ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function YouTravelAccommodationSection({
  content,
  accommodations,
}: {
  tour: TourDetail;
  content: PartnerTourContent;
  accommodations: TourAccommodation[];
}) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const accommodation = accommodations[0];
  const typesSummary =
    content.accommodationTypesSummary?.trim() || accommodation?.name.trim() || "";
  const comfortLabel = content.comfortLabel?.trim();
  const comfortDescription = content.comfortDescription?.trim();
  const comfortDots = content.comfortLevel;
  const images =
    accommodation?.images?.length ? accommodation.images : content.accommodationPhotos ?? [];
  const roomTypes =
    accommodation?.roomTypes?.length
      ? accommodation.roomTypes
      : (content.accommodationRoomTypes ?? []).map((room) => ({
          id: room.id,
          name: room.name,
          description: "",
          capacity: 2,
          priceUsdPerPerson: 0,
          images: [] as string[],
        }));

  const hasContent =
    typesSummary ||
    images.length > 0 ||
    roomTypes.length > 0 ||
    comfortLabel ||
    comfortDescription ||
    comfortDots != null;

  if (!hasContent) return null;

  return (
    <TourSection id="accommodations" title="Проживание">
      <article className={cn(tourDetailCardBorderClass, "overflow-hidden p-5 sm:p-6 md:p-8")}>
        {typesSummary ? (
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky">
              <Building2 className="h-5 w-5" aria-hidden />
            </span>
            <p className="pt-1.5 text-base font-semibold leading-snug text-charcoal">{typesSummary}</p>
          </div>
        ) : null}

        {(comfortLabel || comfortDescription || comfortDots != null) && (
          <div
            className={cn(
              "rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50/80 to-white p-5 sm:p-6",
              typesSummary && "mt-5"
            )}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Комфорт</p>

            {comfortLabel || comfortDots != null ? (
              <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                {comfortLabel ? (
                  <span className="text-sm font-semibold text-charcoal">{comfortLabel}</span>
                ) : null}
                {comfortDots != null ? <ComfortDotRating filled={comfortDots} /> : null}
              </div>
            ) : null}

            {comfortDescription ? (
              <p className="mt-3 text-sm leading-relaxed text-slate">{comfortDescription}</p>
            ) : null}

            <AccommodationPhotoStrip
              images={images}
              onOpenGallery={() => setGalleryOpen(true)}
            />
          </div>
        )}

        {!comfortLabel && !comfortDescription && comfortDots == null && images.length > 0 ? (
          <AccommodationPhotoStrip
            images={images}
            onOpenGallery={() => setGalleryOpen(true)}
          />
        ) : null}

        {roomTypes.length ? (
          <div className={cn("border-t border-gray-100 pt-5", (typesSummary || comfortLabel) && "mt-6")}>
            <h3 className="text-sm font-semibold text-charcoal">Варианты размещения</h3>
            <ul className="mt-3 space-y-2">
              {roomTypes.map((room) => (
                <li
                  key={room.id}
                  className={cn(tourDetailInsetMutedClass, "flex items-start gap-3 px-4 py-3")}
                >
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate" aria-hidden />
                  <span className="text-sm font-medium text-charcoal">{room.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>

      {images.length ? (
        <AccommodationGalleryDialog
          images={images}
          title={typesSummary || "Фото проживания"}
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
        />
      ) : null}
    </TourSection>
  );
}
