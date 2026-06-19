import { cn } from "@/lib/cn";

/** Затемнение нижней части фото — читаемость организатора и точек карусели; верх без вуали, чтобы бейджи оставались яркими. */
export default function TourCardImageVignette({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 z-0", className)} aria-hidden>
      <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-charcoal/52 via-charcoal/20 to-transparent" />
    </div>
  );
}
