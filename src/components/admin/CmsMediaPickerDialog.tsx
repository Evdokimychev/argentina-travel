"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SafeImage } from "@/components/ui/safe-image";
import { mediaUrl } from "@/lib/media-resolver";
import type { MediaAsset } from "@/types/media-asset";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (localPath: string) => void;
};

export default function CmsMediaPickerDialog({ open, onClose, onSelect }: Props) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void fetch("/api/admin/media")
      .then((r) => r.json())
      .then((json: { assets?: MediaAsset[] }) => {
        const cms = (json.assets ?? []).filter((a) => a.id.startsWith("cms:") || a.source === "local");
        setAssets(cms.slice(0, 48));
      })
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl p-0 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Выбор изображения</DialogTitle>
          <DialogDescription className="sr-only">Библиотека медиа CMS</DialogDescription>
        </DialogHeader>
        <DialogBody className="max-h-[min(60vh,calc(100dvh-12rem))] overflow-y-auto pt-0">
          {loading ? <p className="text-sm text-slate">Загрузка…</p> : null}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                className="min-h-11 overflow-hidden rounded-xl border border-gray-200 hover:border-sky/50"
                onClick={() => {
                  onSelect(asset.localPath);
                  onClose();
                }}
              >
                <div className="relative aspect-square bg-gray-100">
                  <SafeImage
                    src={mediaUrl(asset.localPath)}
                    alt={asset.alt}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </div>
              </button>
            ))}
          </div>
          {!loading && assets.length === 0 ? (
            <p className="text-sm text-slate">Нет загруженных изображений.</p>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
