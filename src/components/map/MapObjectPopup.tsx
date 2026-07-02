"use client";

import { useEffect, useState } from "react";
import type { MapObject } from "@/lib/map-types";
import MapObjectCard from "@/components/map/MapObjectCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Props = {
  object: MapObject | null;
  onClose: () => void;
  onSelectObjectId?: (id: string) => void;
};

export default function MapObjectPopup({ object, onClose, onSelectObjectId }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  if (!object) return null;

  if (isMobile) {
    return (
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent
          bottomSheet
          swipeToDismiss
          showClose={false}
          className="max-w-lg gap-0 overflow-hidden p-0 sm:max-h-[min(85vh,520px)]"
        >
          <MapObjectCard
            object={object}
            onClose={onClose}
            onSelectObjectId={onSelectObjectId}
            variant="sheet"
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-20 max-w-[calc(100%-2rem)] sm:bottom-6 sm:right-6">
      <div className="pointer-events-auto">
        <MapObjectCard object={object} onClose={onClose} onSelectObjectId={onSelectObjectId} />
      </div>
    </div>
  );
}
