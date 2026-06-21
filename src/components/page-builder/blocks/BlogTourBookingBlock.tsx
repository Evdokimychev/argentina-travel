import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Props = {
  tourSlug: string;
  label?: string;
  showPrice?: boolean;
};

export default function BlogTourBookingBlock({ tourSlug, label, showPrice }: Props) {
  if (!tourSlug.trim()) return null;

  const href = `/tours/${tourSlug}#booking`;
  const buttonLabel = label?.trim() || "Забронировать тур";

  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
            <CalendarCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="font-heading text-base font-semibold text-charcoal">Бронирование тура</p>
            <p className="mt-0.5 text-sm text-slate">
              {showPrice ? "Выберите дату и узнайте актуальную стоимость на странице тура." : "Перейдите к выбору даты и оформлению заявки."}
            </p>
          </div>
        </div>
        <Link href={href} className={cn(buttonVariants({ size: "lg" }), "shrink-0")}>
          {buttonLabel}
        </Link>
      </div>
    </div>
  );
}
