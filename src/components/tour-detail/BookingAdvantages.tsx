import { CircleCheck } from "lucide-react";
import { cn } from "@/lib/cn";

interface BookingAdvantagesProps {
  items: string[];
  className?: string;
}

export default function BookingAdvantages({ items, className }: BookingAdvantagesProps) {
  if (items.length === 0) return null;

  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-charcoal">
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
          <span className="leading-snug">{item}</span>
        </li>
      ))}
    </ul>
  );
}
