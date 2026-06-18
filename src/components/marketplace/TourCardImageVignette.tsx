import { cn } from "@/lib/cn";

/** Мягкое затемнение краёв фото — читаемость бейджей без тяжёлой вуали. */
export default function TourCardImageVignette({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 z-[1]", className)} aria-hidden>
      <div className="absolute inset-x-0 top-0 h-[34%] bg-gradient-to-b from-charcoal/20 via-charcoal/5 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-charcoal/26 via-charcoal/7 to-transparent" />
    </div>
  );
}
