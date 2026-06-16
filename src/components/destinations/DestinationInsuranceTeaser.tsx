import Link from "next/link";
import { ArrowUpRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type DestinationInsuranceTeaserProps = {
  destinationName: string;
  className?: string;
};

export default function DestinationInsuranceTeaser({
  destinationName,
  className,
}: DestinationInsuranceTeaserProps) {
  return (
    <div className={cn("rounded-2xl border border-gray-100 bg-white p-5 shadow-card", className)}>
      <div className="flex items-start gap-3">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-sky" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-charcoal">Страховка для поездки</p>
          <p className="mt-1 text-sm leading-relaxed text-slate">
            Медицина и эвакуация для маршрута в {destinationName} — оформите полис онлайн до вылета.
          </p>
        </div>
      </div>
      <Link
        href="/insurance"
        className="mt-4 flex items-center justify-between rounded-xl border border-sky/20 bg-sky/5 px-4 py-3 text-sm font-medium text-sky transition-colors hover:bg-sky/10"
      >
        Подобрать полис
        <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
      </Link>
      <p className="mt-3 text-[11px] leading-relaxed text-slate">
        Покупка и условия покрытия — на сайте страхового партнёра (Travelpayouts).
      </p>
    </div>
  );
}
