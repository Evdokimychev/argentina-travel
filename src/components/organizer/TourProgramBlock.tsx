"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ORGANIZER_TOUR_PROGRAM_DAYS_MAX,
  createEmptyProgramDay,
  renumberProgramDays,
  type OrganizerProgramDay,
} from "@/data/tour-program-defaults";
import { ORGANIZER_TOUR_PHOTO_MAX_BYTES } from "@/data/tour-photos-defaults";
import { readFileAsDataUrl } from "@/lib/read-file-as-data-url";
import TourProgramDayEditor from "@/components/organizer/TourProgramDayEditor";

interface TourProgramBlockProps {
  routeMapImage: string;
  programDays: OrganizerProgramDay[];
  onRouteMapChange: (image: string) => void;
  onProgramDaysChange: (days: OrganizerProgramDay[]) => void;
  designExampleHref?: string;
}

export default function TourProgramBlock({
  routeMapImage,
  programDays,
  onRouteMapChange,
  onProgramDaysChange,
  designExampleHref = "/tours/iguazu-falls#itinerary",
}: TourProgramBlockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const days = programDays.length ? programDays : [createEmptyProgramDay(1)];
  const canAddDay = days.length < ORGANIZER_TOUR_PROGRAM_DAYS_MAX;

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

  async function handleMapFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      onRouteMapChange(await uploadFile(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  }

  async function handleMapUrl() {
    setUploading(true);
    setError(null);
    try {
      onRouteMapChange(normalizeUrl(urlInput));
      setUrlInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  }

  function updateAt(index: number, day: OrganizerProgramDay) {
    onProgramDaysChange(days.map((item, itemIndex) => (itemIndex === index ? day : item)));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= days.length) return;
    const next = [...days];
    [next[index], next[target]] = [next[target], next[index]];
    onProgramDaysChange(renumberProgramDays(next));
  }

  function removeAt(index: number) {
    if (days.length <= 1) return;
    onProgramDaysChange(renumberProgramDays(days.filter((_, itemIndex) => itemIndex !== index)));
  }

  function addAfter(index: number) {
    if (!canAddDay) return;
    const next = [...days];
    next.splice(index + 1, 0, createEmptyProgramDay(index + 2));
    onProgramDaysChange(renumberProgramDays(next));
  }

  return (
    <div className="space-y-5">
      <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
              Карта маршрута и описание программы по дням
            </h2>
            <p className="text-sm text-slate">
              Добавьте описание программы тура по дням.{" "}
              <Link href="/help/tour-program-formatting" className="font-medium text-brand hover:underline">
                Общие советы по оформлению
              </Link>
            </p>
          </div>
          <Link
            href={designExampleHref}
            target="_blank"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            <Eye className="h-4 w-4" />
            Пример оформления
          </Link>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-charcoal">
          Не используйте чужие фотографии без разрешения, за это можно получить крупные штрафы —{" "}
          <Link href="/help/photo-copyright" className="font-semibold text-brand hover:underline">
            читать подробнее
          </Link>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-charcoal">Загрузить карту маршрута</p>

          {routeMapImage ? (
            <div className="relative aspect-[16/9] max-w-md overflow-hidden rounded-xl bg-gray-100">
              <Image src={routeMapImage} alt="Карта маршрута" fill className="object-cover" sizes="400px" unoptimized />
              <button
                type="button"
                onClick={() => onRouteMapChange("")}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate shadow-sm hover:text-charcoal"
                aria-label="Удалить карту"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <input
            ref={fileInputRef}
            id="tour-route-map-file"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleMapFile(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky/25 bg-sky/10 px-4 py-3 text-sm font-semibold text-sky transition-colors hover:bg-sky/15 disabled:cursor-not-allowed disabled:opacity-50"
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
                  void handleMapUrl();
                }
              }}
            />
            <Button
              type="button"
              disabled={uploading || !urlInput.trim()}
              onClick={() => void handleMapUrl()}
              className="shrink-0 sm:min-w-[132px]"
            >
              Загрузить
            </Button>
          </div>

          {error ? <p className="text-xs text-brand">{error}</p> : null}
        </div>
      </section>

      <div className="space-y-4">
        {days.map((day, index) => (
          <TourProgramDayEditor
            key={day.id}
            day={day}
            index={index}
            total={days.length}
            canAddDay={canAddDay}
            onChange={(next) => updateAt(index, next)}
            onRemove={() => removeAt(index)}
            onMoveUp={() => moveItem(index, -1)}
            onMoveDown={() => moveItem(index, 1)}
            onAddAfter={() => addAfter(index)}
          />
        ))}
      </div>
    </div>
  );
}
