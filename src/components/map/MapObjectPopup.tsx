"use client";

import { useEffect, useState } from "react";
import type { MapObject } from "@/lib/map-types";
import MapObjectCard from "@/components/map/MapObjectCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Props = {
  object: MapObject | null;
  onClose: () => void;
};

export default function MapObjectPopup({ object, onClose }: Props) {
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
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent bottomSheet showClose={false} className="max-w-lg p-0">
          <MapObjectCard object={object} onClose={onClose} variant="sheet" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-20 max-w-[calc(100%-2rem)] sm:bottom-6 sm:right-6">
      <div className="pointer-events-auto">
        <MapObjectCard object={object} onClose={onClose} />
      </div>
    </div>
  );
}
