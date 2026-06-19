"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/auth/UserAvatar";
import {
  ORGANIZER_TOUR_GUIDE_BIO_MAX,
  createCustomGuide,
} from "@/data/tour-guides-defaults";
import { ORGANIZER_TOUR_PHOTO_MAX_BYTES } from "@/data/tour-photos-defaults";
import { joinFullName, splitFullName } from "@/lib/full-name";
import { readFileAsDataUrl } from "@/lib/read-file-as-data-url";
import type { OrganizerTeamGuide } from "@/types/organizer-profile";
import type { OrganizerTourGuide } from "@/types/organizer-tour";

interface TourGuideCreateModalProps {
  open: boolean;
  onClose: () => void;
  /** @deprecated Use onSave */
  onCreate?: (guide: OrganizerTourGuide) => void;
  onSave?: (guide: OrganizerTourGuide) => void;
  initialGuide?: OrganizerTeamGuide | OrganizerTourGuide;
}

export default function TourGuideCreateModal({
  open,
  onClose,
  onCreate,
  onSave,
  initialGuide,
}: TourGuideCreateModalProps) {
  const isEditing = Boolean(initialGuide);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) {
      setLastName("");
      setFirstName("");
      setBio("");
      setAvatar("");
      setUrlInput("");
      setError(null);
      setUploading(false);
      return;
    }

    if (initialGuide) {
      const { firstName: nextFirst, lastName: nextLast } = splitFullName(initialGuide.name);
      setFirstName(nextFirst);
      setLastName(nextLast);
      setBio(initialGuide.bio);
      setAvatar(initialGuide.avatar);
    } else {
      setLastName("");
      setFirstName("");
      setBio("");
      setAvatar("");
    }
    setUrlInput("");
    setError(null);
    setUploading(false);
  }, [open, initialGuide]);

  const previewName = joinFullName(firstName, lastName) || "Новый гид";

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      throw new Error("Выберите файл изображения");
    }
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

  async function handleFileSelect(file: File) {
    setUploading(true);
    setError(null);
    try {
      setAvatar(await uploadFile(file));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  }

  async function handleUrlUpload() {
    setUploading(true);
    setError(null);
    try {
      setAvatar(normalizeUrl(urlInput));
      setUrlInput("");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!lastName.trim()) {
      setError("Укажите фамилию гида");
      return;
    }

    if (!firstName.trim()) {
      setError("Укажите имя гида");
      return;
    }

    if (!bio.trim()) {
      setError("Добавьте описание гида");
      return;
    }

    const guide = createCustomGuide({
      id: initialGuide?.id,
      firstName,
      lastName,
      avatar,
      bio,
    });

    (onSave ?? onCreate)?.(guide);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="flex max-h-[90vh] max-w-lg animate-fade-in-up flex-col overflow-hidden p-0"
        onPointerDownOutside={onClose}
        onEscapeKeyDown={onClose}
      >
      <form
        className="flex flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <DialogTitle className="text-lg sm:text-xl">
              {isEditing ? "Редактировать гида" : "Новый гид"}
            </DialogTitle>
            <p className="mt-1 text-sm text-slate">
              {isEditing
                ? "Обновите фото и данные гида"
                : "Загрузите фото и заполните данные гида"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate transition-colors hover:bg-gray-100 hover:text-charcoal"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {avatar ? (
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gray-100">
                <Image src={avatar} alt={previewName} fill className="object-cover" unoptimized />
                <button
                  type="button"
                  onClick={() => setAvatar("")}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate shadow-sm hover:text-charcoal"
                  aria-label="Удалить фото"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <UserAvatar name={previewName} avatarUrl={null} className="h-24 w-24 text-2xl" />
            )}

            <div className="w-full min-w-0 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFileSelect(file);
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
                      void handleUrlUpload();
                    }
                  }}
                />
                <Button
                  type="button"
                  disabled={uploading || !urlInput.trim()}
                  onClick={() => void handleUrlUpload()}
                  className="shrink-0 sm:min-w-[132px]"
                >
                  <Camera className="h-4 w-4" />
                  Загрузить
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="guide-last-name" className="mb-1.5 block text-xs font-medium text-charcoal">
                Фамилия *
              </label>
              <Input
                id="guide-last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="guide-first-name" className="mb-1.5 block text-xs font-medium text-charcoal">
                Имя *
              </label>
              <Input
                id="guide-first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="guide-bio" className="mb-1.5 block text-xs font-medium text-charcoal">
              Описание *
            </label>
            <Textarea
              id="guide-bio"
              value={bio}
              rows={6}
              maxLength={ORGANIZER_TOUR_GUIDE_BIO_MAX}
              onChange={(event) =>
                setBio(event.target.value.slice(0, ORGANIZER_TOUR_GUIDE_BIO_MAX))
              }
              placeholder="Расскажите об опыте гида, языках и специализации…"
              required
            />
            <p className="mt-1 text-right text-xs text-slate">
              {bio.length} / {ORGANIZER_TOUR_GUIDE_BIO_MAX}
            </p>
          </div>

          {error ? (
            <div role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit">{isEditing ? "Сохранить" : "Добавить гида"}</Button>
        </div>
      </form>
      </DialogContent>
    </Dialog>
  );
}
