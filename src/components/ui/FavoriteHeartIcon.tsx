import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";

export default function FavoriteHeartIcon({
  filled = false,
  className,
}: {
  filled?: boolean;
  className?: string;
}) {
  return (
    <Heart
      className={cn("shrink-0", className)}
      fill={filled ? "currentColor" : "none"}
      strokeWidth={2}
      aria-hidden
    />
  );
}
