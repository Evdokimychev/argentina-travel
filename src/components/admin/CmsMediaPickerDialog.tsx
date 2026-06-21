"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h3 className="font-heading text-sm font-bold text-charcoal">Выбор изображения</h3>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Закрыть
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {loading ? <p className="text-sm text-slate">Загрузка…</p> : null}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                className="overflow-hidden rounded-xl border border-gray-200 hover:border-sky/50"
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
            <p className="text-sm text-slate">Нет загруженных изображений. Добавьте в медиатеке.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
