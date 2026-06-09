import Image from "next/image";
import { cn } from "@/lib/cn";
import type { TransferVehicleOption } from "./checkout-addons";

interface TransferVehicleThumbnailProps {
  vehicle: Pick<TransferVehicleOption, "title" | "image">;
  className?: string;
}

export default function TransferVehicleThumbnail({
  vehicle,
  className,
}: TransferVehicleThumbnailProps) {
  return (
    <div
      className={cn(
        "relative h-14 w-[5.5rem] shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-white",
        className
      )}
    >
      <Image
        src={vehicle.image}
        alt={vehicle.title}
        fill
        sizes="88px"
        className="object-contain object-center p-1.5"
      />
    </div>
  );
}
