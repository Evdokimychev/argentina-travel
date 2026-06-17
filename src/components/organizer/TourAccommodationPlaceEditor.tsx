"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Camera,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACCOMMODATION_FILTER_OPTIONS } from "@/data/accommodation-options";
import {
  ACCOMMODATION_NAME_PRESETS,
  ACCOMMODATION_AMENITY_PRESETS,
  DEFAULT_BOOKING_LABEL,
  ORGANIZER_TOUR_ACCOMMODATION_ALTERNATIVES_MAX,
  ORGANIZER_TOUR_ACCOMMODATION_AMENITIES_MAX,
  ORGANIZER_TOUR_ACCOMMODATION_PHOTOS_MAX,
  ORGANIZER_TOUR_ACCOMMODATION_PLACE_DESCRIPTION_MAX,
  createEmptyAccommodationAlternative,
  type OrganizerTourAccommodationPlace,
} from "@/data/tour-accommodation-defaults";
import { isAllowedBookingUrl } from "@/lib/tour-accommodation-public";
import TourAccommodationRoomTypesEditor from "@/components/organizer/TourAccommodationRoomTypesEditor";
import { ORGANIZER_TOUR_PHOTO_MAX_BYTES } from "@/data/tour-photos-defaults";
import { readFileAsDataUrl } from "@/lib/read-file-as-data-url";
import RichTextEditor from "@/components/editor/RichTextEditor";

function PhotoUploadSection({
  images,
  onChange,
  inputId,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  inputId: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) throw new Error("Выберите файл изображения");
    if (file.size > ORGANIZER_TOUR_PHOTO_MAX_BYTES) {
      throw new Error("Фото должно быть не больше 5 МБ");
    }
    return readFileAsDataUrl(file);
  }

  function normalizeUrl(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) throw new Error("Вставьте ссылку на фото");
    if (!/^https?:\/\//i.test(trimmed)) {
      throw new Error("Ссылка должна начинаться с http:// или https://");
    }
    return trimmed;
  }

  async function addImage(src: string) {
    if (images.length >= ORGANIZER_TOUR_ACCOMMODATION_PHOTOS_MAX) {
      setError(`Можно загрузить не больше ${ORGANIZER_TOUR_ACCOMMODATION_PHOTOS_MAX} фото`);
      return;
    }
    onChange([...images, src]);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-charcoal">Добавьте фотографии</p>
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setUploading(true);
          setError(null);
          try {
            await addImage(await uploadFile(file));
          } catch (uploadError) {
            setError(
              uploadError instanceof Error ? uploadError.message : "Не удалось загрузить фото"
            );
          } finally {
            setUploading(false);
            event.target.value = "";
          }
        }}
      />
      <button
        type="button"
        disabled={uploading || images.length >= ORGANIZER_TOUR_ACCOMMODATION_PHOTOS_MAX}
        onClick={() => fileInputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky/25 bg-sky/10 px-4 py-3.5 text-sm font-semibold text-sky transition-colors hover:bg-sky/15 disabled:opacity-50"
      >
        <Camera className="h-4 w-4" />
        Загрузить фото с устройства
      </button>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          placeholder="Или вставьте ссылку на фото"
          disabled={uploading}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void (async () => {
                setUploading(true);
                setError(null);
                try {
                  await addImage(normalizeUrl(urlInput));
                  setUrlInput("");
                } catch (uploadError) {
                  setError(
                    uploadError instanceof Error ? uploadError.message : "Не удалось загрузить фото"
                  );
                } finally {
                  setUploading(false);
                }
              })();
            }
          }}
        />
        <Button
          type="button"
          disabled={uploading || !urlInput.trim()}
          onClick={async () => {
            setUploading(true);
            setError(null);
            try {
              await addImage(normalizeUrl(urlInput));
              setUrlInput("");
            } catch (uploadError) {
              setError(
                uploadError instanceof Error ? uploadError.message : "Не удалось загрузить фото"
              );
            } finally {
              setUploading(false);
            }
          }}
          className="shrink-0 sm:min-w-[132px]"
        >
          <Camera className="h-4 w-4" />
          Загрузить
        </Button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {images.length ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((image, index) => (
            <div key={`${image}-${index}`} className="relative aspect-square overflow-hidden rounded-xl">
              <Image src={image} alt="" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate"
                aria-label="Удалить фото"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface TourAccommodationPlaceEditorProps {
  index: number;
  total: number;
  place: OrganizerTourAccommodationPlace;
  onChange: (place: OrganizerTourAccommodationPlace) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export default function TourAccommodationPlaceEditor({
  index,
  total,
  place,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: TourAccommodationPlaceEditorProps) {
  const [bookingUrlError, setBookingUrlError] = useState<string | null>(null);
  const isManual = place.displayMode !== "booking_link";
  const isBookingLink = place.displayMode === "booking_link";

  function addAlternative() {
    if (place.alternatives.length >= ORGANIZER_TOUR_ACCOMMODATION_ALTERNATIVES_MAX) return;
    onChange({
      ...place,
      alternatives: [...place.alternatives, createEmptyAccommodationAlternative()],
    });
  }

  const nightsLabel = place.nights === 1 ? "1 ночь" : `${place.nights} ночи`;

  return (
    <article className="space-y-5 rounded-2xl border border-gray-200 bg-brand-light/20 p-4 sm:p-5">
      <h3 className="font-heading text-lg font-bold text-charcoal">{index + 1} Место проживания</h3>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-charcoal">Количество ночей</label>
          <Input
            type="number"
            min={1}
            value={place.nights}
            onChange={(event) =>
              onChange({ ...place, nights: Math.max(1, Number(event.target.value) || 1) })
            }
          />
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-charcoal">
          <input
            type="checkbox"
            checked={place.fullPeriod}
            onChange={(event) => onChange({ ...place, fullPeriod: event.target.checked })}
            className="h-4 w-4 rounded border-gray-300 accent-brand"
          />
          Весь период проживания
        </label>
      </div>

      <p className="text-sm text-slate">
        Выберите из списка или добавьте новое место проживания
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-charcoal">
            Название места проживания
          </label>
          <Input
            list={`accommodation-names-${place.id}`}
            value={place.name}
            onChange={(event) => onChange({ ...place, name: event.target.value })}
            placeholder="Например, Отель «Турист»"
          />
          <datalist id={`accommodation-names-${place.id}`}>
            {ACCOMMODATION_NAME_PRESETS.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-charcoal">Тип проживания</label>
          <select
            value={place.accommodationType}
            onChange={(event) =>
              onChange({
                ...place,
                accommodationType: event.target.value as OrganizerTourAccommodationPlace["accommodationType"],
              })
            }
            className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-charcoal focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            {ACCOMMODATION_FILTER_OPTIONS.map((option) => (
              <option key={option.type} value={option.type}>
                {option.type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-200/80 bg-white p-4">
        <div>
          <h4 className="text-sm font-bold text-charcoal">Как показывать это место</h4>
          <p className="mt-1 text-sm text-slate">
            Описание вручную или ссылка на Booking.com — выберите один вариант
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              onChange({
                ...place,
                displayMode: "manual",
                bookingUrl: undefined,
              })
            }
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              isManual
                ? "bg-brand text-white"
                : "border border-gray-200 bg-white text-charcoal hover:border-brand/40"
            }`}
          >
            Описание вручную
          </button>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...place,
                displayMode: "booking_link",
                roomTypes: [],
              })
            }
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              isBookingLink
                ? "bg-brand text-white"
                : "border border-gray-200 bg-white text-charcoal hover:border-brand/40"
            }`}
          >
            Ссылка на Booking.com
          </button>
        </div>

        {isBookingLink ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-charcoal">
                Ссылка на отель на Booking.com
              </label>
              <Input
                value={place.bookingUrl ?? ""}
                onChange={(event) => {
                  const bookingUrl = event.target.value;
                  onChange({ ...place, bookingUrl });
                  if (bookingUrl.trim() && !isAllowedBookingUrl(bookingUrl)) {
                    setBookingUrlError("Разрешены только ссылки на booking.com");
                  } else {
                    setBookingUrlError(null);
                  }
                }}
                placeholder="https://www.booking.com/hotel/..."
              />
              {bookingUrlError ? (
                <p className="mt-1 text-xs text-red-600">{bookingUrlError}</p>
              ) : (
                <p className="mt-1 text-xs text-slate">
                  Турист увидит краткое описание и кнопку перехода на Booking.com
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-charcoal">
                Текст кнопки
              </label>
              <Input
                value={place.bookingLabel ?? DEFAULT_BOOKING_LABEL}
                onChange={(event) => onChange({ ...place, bookingLabel: event.target.value })}
              />
            </div>
          </div>
        ) : null}
      </div>

      {isManual ? (
        <>
          <RichTextEditor
            id={`accommodation-place-description-${place.id}`}
            value={place.description}
            onChange={(description) => onChange({ ...place, description })}
            maxLength={ORGANIZER_TOUR_ACCOMMODATION_PLACE_DESCRIPTION_MAX}
            placeholder="Опишите условия проживания…"
            minHeight={144}
          />

          <div className="space-y-3 rounded-2xl border border-gray-200/80 bg-white p-4">
            <div>
              <h4 className="text-sm font-bold text-charcoal">Удобства</h4>
              <p className="mt-1 text-sm text-slate">Отметьте, что включено в проживание</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ACCOMMODATION_AMENITY_PRESETS.map((amenity) => {
                const selected = place.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    disabled={
                      !selected && place.amenities.length >= ORGANIZER_TOUR_ACCOMMODATION_AMENITIES_MAX
                    }
                    onClick={() => {
                      const amenities = selected
                        ? place.amenities.filter((item) => item !== amenity)
                        : [...place.amenities, amenity];
                      onChange({ ...place, amenities });
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      selected
                        ? "bg-brand text-white"
                        : "border border-gray-200 bg-white text-charcoal hover:border-brand/40"
                    }`}
                  >
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>

          <TourAccommodationRoomTypesEditor
            roomTypes={place.roomTypes}
            onChange={(roomTypes) => onChange({ ...place, roomTypes })}
          />
        </>
      ) : (
        <RichTextEditor
          id={`accommodation-place-description-${place.id}`}
          value={place.description}
          onChange={(description) => onChange({ ...place, description })}
          maxLength={ORGANIZER_TOUR_ACCOMMODATION_PLACE_DESCRIPTION_MAX}
          placeholder="Кратко опишите место — турист увидит это рядом со ссылкой на Booking.com"
          minHeight={96}
        />
      )}

      <PhotoUploadSection
        inputId={`accommodation-place-photos-${place.id}`}
        images={place.images}
        onChange={(images) => onChange({ ...place, images })}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Удалить это место проживания
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate">Изменить порядок места проживания</span>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="inline-flex h-9 items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium disabled:opacity-40"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="inline-flex h-9 items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium disabled:opacity-40"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-200/80 bg-white p-4">
        <div>
          <h4 className="text-sm font-bold text-charcoal">
            Проживание на выбор в эту {nightsLabel}
          </h4>
          <p className="mt-1 text-sm text-slate">
            Если можно выбрать другой вариант проживания в этот период тура — добавьте его тут
          </p>
        </div>

        {place.alternatives.map((alternative, altIndex) => (
          <div key={alternative.id} className="space-y-3 rounded-xl border border-gray-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-charcoal">Вариант {altIndex + 1}</p>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...place,
                    alternatives: place.alternatives.filter((item) => item.id !== alternative.id),
                  })
                }
                className="text-xs text-red-600 hover:underline"
              >
                Удалить
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={alternative.name}
                onChange={(event) =>
                  onChange({
                    ...place,
                    alternatives: place.alternatives.map((item) =>
                      item.id === alternative.id ? { ...item, name: event.target.value } : item
                    ),
                  })
                }
                placeholder="Название варианта"
              />
              <select
                value={alternative.accommodationType}
                onChange={(event) =>
                  onChange({
                    ...place,
                    alternatives: place.alternatives.map((item) =>
                      item.id === alternative.id
                        ? {
                            ...item,
                            accommodationType:
                              event.target.value as OrganizerTourAccommodationPlace["accommodationType"],
                          }
                        : item
                    ),
                  })
                }
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm"
              >
                {ACCOMMODATION_FILTER_OPTIONS.map((option) => (
                  <option key={option.type} value={option.type}>
                    {option.type}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={alternative.description}
              rows={3}
              onChange={(event) =>
                onChange({
                  ...place,
                  alternatives: place.alternatives.map((item) =>
                    item.id === alternative.id
                      ? { ...item, description: event.target.value }
                      : item
                  ),
                })
              }
              placeholder="Краткое описание варианта"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        ))}

        {place.alternatives.length < ORGANIZER_TOUR_ACCOMMODATION_ALTERNATIVES_MAX ? (
          <button
            type="button"
            onClick={addAlternative}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand/10 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/15"
          >
            <Plus className="h-4 w-4" />
            Добавить вариант
          </button>
        ) : null}
      </div>
    </article>
  );
}
