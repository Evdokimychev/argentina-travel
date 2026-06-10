"use client";

import { useState } from "react";
import Image from "next/image";
import { Info, Link2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { TourAccommodation } from "@/types";

interface TourAccommodationVariantsBlockProps {
  variantLabel: string;
  variantPlaces: TourAccommodation[];
  onReplaceAll?: () => void;
}

function VariantPlacesModal({
  open,
  onClose,
  variantLabel,
  places,
}: {
  open: boolean;
  onClose: () => void;
  variantLabel: string;
  places: TourAccommodation[];
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="flex max-h-[90vh] max-w-lg flex-col overflow-hidden p-0"
        onPointerDownOutside={onClose}
        onEscapeKeyDown={onClose}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <DialogTitle className="text-lg">Проживание в варианте</DialogTitle>
            <p className="mt-1 text-sm text-slate">«{variantLabel}»</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate hover:bg-gray-100 hover:text-charcoal"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto px-5 py-5">
          {places.map((place) => (
            <article key={place.id} className="overflow-hidden rounded-2xl border border-gray-200">
              {place.images[0] ? (
                <div className="relative h-40">
                  <Image
                    src={place.images[0]}
                    alt={place.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : null}
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-charcoal">{place.name}</h4>
                  <span className="rounded-full bg-sky/10 px-2.5 py-0.5 text-xs font-medium text-sky">
                    {place.comfort}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate">{place.description}</p>
                {place.amenities.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {place.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="rounded-lg bg-pampas px-2 py-0.5 text-xs text-slate"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TourAccommodationVariantsBlock({
  variantLabel,
  variantPlaces,
  onReplaceAll,
}: TourAccommodationVariantsBlockProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!variantPlaces.length) return null;

  return (
    <>
      <section className="space-y-4 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
          Проживание имеет отличия в вариантах тура
        </h2>

        {onReplaceAll ? (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-charcoal">
            <button type="button" onClick={onReplaceAll} className="text-left">
              <Link2 className="mr-1.5 inline h-4 w-4 align-[-2px] text-brand" />
              Заменить проживание во всех вариантах тура?{" "}
              <span className="font-semibold text-brand hover:underline">Заменить</span>
            </button>
          </div>
        ) : null}

        <div className="rounded-xl bg-brand-light/80 px-4 py-3 text-sm leading-relaxed text-charcoal">
          <Info className="mr-1.5 inline h-4 w-4 align-[-2px] text-brand" />
          Отличия в варианте «{variantLabel}»:{" "}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="font-semibold text-brand hover:underline"
          >
            Посмотреть
          </button>
        </div>
      </section>

      <VariantPlacesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        variantLabel={variantLabel}
        places={variantPlaces}
      />
    </>
  );
}
