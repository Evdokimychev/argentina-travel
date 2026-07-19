"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { SafeImage } from "@/components/ui/safe-image";
import { mediaUrl } from "@/lib/media-resolver";
import type { MediaAsset } from "@/types/media-asset";

type Props = {
  assets: MediaAsset[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onUpdated: () => void | Promise<void>;
};

export default function MediaLightbox({ assets, index, onClose, onNavigate, onUpdated }: Props) {
  const asset = assets[index];
  const hasPrev = index > 0;
  const hasNext = index < assets.length - 1;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [creator, setCreator] = useState("");
  const [license, setLicense] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("");
  const [sourcePageUrl, setSourcePageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [attribution, setAttribution] = useState("");
  const [focalX, setFocalX] = useState("0.5");
  const [focalY, setFocalY] = useState("0.5");
  const [rightsStatus, setRightsStatus] = useState<NonNullable<MediaAsset["rightsStatus"]>>(
    "review_required"
  );

  useEffect(() => {
    if (!asset) return;
    setAlt(asset.alt ?? "");
    setCreator(asset.author ?? "");
    setLicense(asset.license ?? "");
    setLicenseUrl(asset.licenseUrl ?? "");
    setSourcePageUrl(asset.sourcePageUrl ?? asset.sourceUrl ?? "");
    setCaption(asset.caption ?? "");
    setAttribution(asset.attributionHtml ?? "");
    setFocalX(String(asset.focalPoint?.x ?? 0.5));
    setFocalY(String(asset.focalPoint?.y ?? 0.5));
    setRightsStatus(asset.rightsStatus ?? "review_required");
    setError(null);
  }, [asset]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(index - 1);
      if (e.key === "ArrowRight" && hasNext) onNavigate(index + 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasNext, hasPrev, index, onClose, onNavigate]);

  if (!asset) return null;
  const isCmsAsset = asset.id.startsWith("cms:");

  async function saveRights() {
    if (!isCmsAsset) return;
    setSaving(true);
    setError(null);
    try {
      const x = Number(focalX);
      const y = Number(focalY);
      const response = await fetch(`/api/admin/media/${encodeURIComponent(asset.id.slice(4))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alt: alt.trim(),
          creator: creator.trim() || null,
          license: license.trim() || null,
          licenseUrl: licenseUrl.trim() || null,
          sourcePageUrl: sourcePageUrl.trim() || null,
          captionRu: caption.trim() || null,
          attributionText: attribution.trim() || null,
          focalPoint: {
            x: Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0.5,
            y: Number.isFinite(y) ? Math.min(1, Math.max(0, y)) : 0.5,
          },
          rightsStatus,
        }),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Не удалось сохранить права");
      await onUpdated();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр изображения"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 text-white hover:bg-white/10"
        onClick={onClose}
        aria-label="Закрыть"
      >
        <X className="h-5 w-5" />
      </Button>

      {hasPrev ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
          onClick={() => onNavigate(index - 1)}
          aria-label="Предыдущее"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      ) : null}

      {hasNext ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
          onClick={() => onNavigate(index + 1)}
          aria-label="Следующее"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      ) : null}

      <div className="max-h-[90vh] max-w-5xl overflow-y-auto rounded-2xl bg-black">
        <div className="relative aspect-[16/10] w-[min(90vw,960px)]">
          <SafeImage
            src={mediaUrl(asset.localPath)}
            alt={asset.alt}
            fill
            className="object-contain"
            sizes="960px"
            priority
          />
        </div>
        <div className="space-y-1 bg-charcoal/95 px-4 py-3 text-sm text-white">
          <p className="font-medium">{asset.title}</p>
          <p className="text-xs text-white/70">{asset.id}</p>
          {asset.alt ? <p className="text-xs text-white/80">{asset.alt}</p> : null}
        </div>
        {isCmsAsset ? (
          <div className="space-y-3 bg-white p-4 text-sm text-charcoal">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Права и атрибуция</p>
                <p className="text-xs text-slate">Статус влияет на публикационный шлюз.</p>
              </div>
              <NativeSelect
                className="w-44"
                value={rightsStatus}
                onChange={(event) =>
                  setRightsStatus(event.target.value as NonNullable<MediaAsset["rightsStatus"]>)
                }
              >
                <option value="review_required">Нужна проверка</option>
                <option value="verified">Права подтверждены</option>
                <option value="restricted">Ограничено</option>
                <option value="expired">Истекло</option>
                <option value="rejected">Не использовать</option>
              </NativeSelect>
            </div>
            {error ? <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-slate">
                <span>Alt</span>
                <Input value={alt} onChange={(event) => setAlt(event.target.value)} />
              </label>
              <label className="space-y-1 text-xs text-slate">
                <span>Автор / правообладатель</span>
                <Input value={creator} onChange={(event) => setCreator(event.target.value)} />
              </label>
              <label className="space-y-1 text-xs text-slate">
                <span>Лицензия</span>
                <Input value={license} onChange={(event) => setLicense(event.target.value)} />
              </label>
              <label className="space-y-1 text-xs text-slate">
                <span>Ссылка на лицензию</span>
                <Input type="url" value={licenseUrl} onChange={(event) => setLicenseUrl(event.target.value)} />
              </label>
            </div>
            <label className="block space-y-1 text-xs text-slate">
              <span>Страница источника</span>
              <Input type="url" value={sourcePageUrl} onChange={(event) => setSourcePageUrl(event.target.value)} />
            </label>
            <label className="block space-y-1 text-xs text-slate">
              <span>Подпись</span>
              <Input value={caption} onChange={(event) => setCaption(event.target.value)} />
            </label>
            <label className="block space-y-1 text-xs text-slate">
              <span>Атрибуция</span>
              <Input value={attribution} onChange={(event) => setAttribution(event.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs text-slate">
                <span>Фокус X (0–1)</span>
                <Input type="number" min="0" max="1" step="0.05" value={focalX} onChange={(event) => setFocalX(event.target.value)} />
              </label>
              <label className="space-y-1 text-xs text-slate">
                <span>Фокус Y (0–1)</span>
                <Input type="number" min="0" max="1" step="0.05" value={focalY} onChange={(event) => setFocalY(event.target.value)} />
              </label>
            </div>
            <Button className="w-full" disabled={saving} onClick={() => void saveRights()}>
              {saving ? "Сохранение…" : "Сохранить права"}
            </Button>
          </div>
        ) : (
          <p className="bg-white px-4 py-3 text-xs text-amber-800">
            Этот файл управляется manifest. Права проверяются в реестре медиа; редактирование доступно для CMS-загрузок.
          </p>
        )}
      </div>
    </div>
  );
}
