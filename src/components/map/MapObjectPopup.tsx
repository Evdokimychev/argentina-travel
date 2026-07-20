"use client";

import { useEffect, useState } from "react";
import type { MapObject } from "@/lib/map-types";
import type { NearbyMapObject } from "@/lib/map-discovery";
import MapObjectCard from "@/components/map/MapObjectCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  object: MapObject | null;
  onClose: () => void;
  onSelectObjectId?: (id: string) => void;
  selectedFlightDestinationIata?: string | null;
  onSelectFlightDestination?: (iata: string | null) => void;
  onNavigate?: (href: string) => void;
  nearbyObjects?: NearbyMapObject[];
};

export default function MapObjectPopup({
  object,
  onClose,
  onSelectObjectId,
  selectedFlightDestinationIata,
  onSelectFlightDestination,
  onNavigate,
  nearbyObjects,
}: Props) {
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
        closeOnBackNavigation={false}
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
          <DialogTitle className="sr-only">{object.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Информация об объекте на карте: {object.title}
          </DialogDescription>
          <MapObjectCard
            object={object}
            onClose={onClose}
            onSelectObjectId={onSelectObjectId}
            selectedFlightDestinationIata={selectedFlightDestinationIata}
            onSelectFlightDestination={onSelectFlightDestination}
            onNavigate={onNavigate}
            nearbyObjects={nearbyObjects}
            variant="sheet"
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-30 max-w-[calc(100%-2rem)] sm:bottom-6 sm:right-6">
      <div className="pointer-events-auto">
        <MapObjectCard
          object={object}
          onClose={onClose}
          onSelectObjectId={onSelectObjectId}
          selectedFlightDestinationIata={selectedFlightDestinationIata}
          onSelectFlightDestination={onSelectFlightDestination}
          onNavigate={onNavigate}
          nearbyObjects={nearbyObjects}
        />
      </div>
    </div>
  );
}
