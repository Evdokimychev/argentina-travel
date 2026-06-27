"use client";

import Link from "next/link";
import {
  Baby,
  CalendarDays,
  Footprints,
  Globe,
  PackagePlus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import TourSection from "@/components/tour-detail/TourSection";
import ExcursionAdditionalServicesSection from "@/components/excursions/ExcursionAdditionalServicesSection";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { resolveExcursionAdditionalServices } from "@/lib/excursion-calendar";
import { buildExcursionDetailItems } from "@/lib/excursion-detail-items";
import { cn } from "@/lib/cn";
import type { ExcursionDetail } from "@/types/excursion";

const DETAIL_ICONS: Record<string, LucideIcon> = {
  movement: Footprints,
  duration: CalendarDays,
  children: Baby,
  languages: Globe,
  format: UsersRound,
  "additional-services": PackagePlus,
};

function DetailRow({
  id,
  label,
  value,
  linkHref,
}: {
  id: string;
  label: string;
  value: string;
  linkHref?: string;
}) {
  const Icon = DETAIL_ICONS[id] ?? CalendarDays;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky">
        <Icon className="h-[18px] w-[18px] stroke-[1.75]" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-slate">{label}</p>
        {linkHref ? (
          <Link
            href={linkHref}
            className="mt-0.5 block text-sm font-semibold leading-snug text-sky hover:underline"
          >
            {value}
          </Link>
        ) : (
          <p className="mt-0.5 text-sm font-semibold leading-snug text-charcoal">{value}</p>
        )}
      </div>
    </div>
  );
}

export default function ExcursionStatsSection({ excursion }: { excursion: ExcursionDetail }) {
  const { t } = useLocaleCurrency();
  const detailItems = buildExcursionDetailItems(excursion, t);
  const additionalServices = resolveExcursionAdditionalServices(excursion.ticketOptions);

  if (detailItems.length === 0) {
    return null;
  }

  return (
    <TourSection id="excursion-details" title={t("excursions.section.details")}>
      <div className="space-y-4">
        <div className={cn("grid gap-3 sm:grid-cols-2")}>
          {detailItems.map((item) => (
            <DetailRow
              key={item.id}
              id={item.id}
              label={item.label}
              value={item.value}
              linkHref={item.linkHref}
            />
          ))}
        </div>

        {additionalServices.length > 0 ? (
          <ExcursionAdditionalServicesSection
            ticketOptions={excursion.ticketOptions}
            priceCurrency={excursion.priceCurrency}
            className="scroll-mt-24"
            id="additional-services"
          />
        ) : null}
      </div>
    </TourSection>
  );
}
