"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Globe,
  MessageCircle,
  RotateCcw,
  Shield,
  Zap,
  type LucideIcon,
} from "lucide-react";
import TourSection from "@/components/tour-detail/TourSection";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import {
  buildExcursionBookingConditions,
  type ExcursionBookingConditionItem,
  type ExcursionBookingConditionKind,
  type ExcursionBookingConditions,
} from "@/lib/tripster/booking-conditions";
import type { ExcursionDetail } from "@/types/excursion";

const ICONS: Partial<Record<ExcursionBookingConditionKind, LucideIcon>> = {
  prepayment: CreditCard,
  bestPrice: Shield,
  cards: Globe,
  cancellation: RotateCcw,
  instantBooking: Zap,
  askOrganizer: MessageCircle,
  custom: Shield,
};

type ExcursionBookingConditionsSectionProps = {
  excursion: ExcursionDetail;
};

function ConditionText({
  item,
  t,
}: {
  item: ExcursionBookingConditionItem;
  t: (key: string) => string;
}) {
  switch (item.kind) {
    case "prepayment":
      return (
        <>
          {t("excursions.bookingConditions.prepayment")
            .replace("{prepay}", String(item.prepaymentPercent ?? 0))
            .replace("{rest}", String(item.restPercent ?? 0))}
        </>
      );
    case "bestPrice":
      return (
        <>
          {t("excursions.bookingConditions.bestPrice")}{" "}
          {item.linkHref ? (
            <Link
              href={item.linkHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sky transition hover:text-sky/80"
            >
              {t("excursions.bookingConditions.more")}
            </Link>
          ) : null}
        </>
      );
    case "cards":
      return <>{t("excursions.bookingConditions.cards")}</>;
    case "cancellation":
      return (
        <>
          {t("excursions.bookingConditions.cancellation").replace(
            "{hours}",
            String(item.cancellationHours ?? 0)
          )}
        </>
      );
    case "instantBooking":
      return <>{t("excursions.bookingConditions.instantBooking")}</>;
    case "askOrganizer":
      return <>{t("excursions.bookingConditions.askOrganizer")}</>;
    case "custom":
      return <>{item.text}</>;
    default:
      return null;
  }
}

export default function ExcursionBookingConditionsSection({
  excursion,
}: ExcursionBookingConditionsSectionProps) {
  const { t } = useLocaleCurrency();
  const [conditions, setConditions] = useState<ExcursionBookingConditions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadConditions() {
      setLoading(true);
      try {
        const response = await fetch(`/api/excursions/${excursion.slug}/booking-conditions`);
        const data = (await response.json()) as ExcursionBookingConditions & { error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "Booking conditions unavailable");
        }

        if (!cancelled) {
          setConditions({ items: data.items ?? [] });
        }
      } catch {
        if (!cancelled) {
          setConditions(
            buildExcursionBookingConditions({
              quote: null,
              instantBooking: excursion.instantBooking,
              isBookable: excursion.isBookable,
              priceDescription: excursion.priceDescription,
            })
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadConditions();
    return () => {
      cancelled = true;
    };
  }, [excursion.slug, excursion.instantBooking, excursion.isBookable, excursion.priceDescription]);

  const items = conditions?.items ?? [];

  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <TourSection id="booking-conditions" title={t("excursions.section.bookingConditions")}>
      {loading ? (
        <p className="text-sm text-slate">{t("excursions.bookingConditions.loading")}</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item, index) => {
            const Icon = ICONS[item.kind] ?? Shield;
            return (
              <li key={`${item.kind}-${index}`} className="flex gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky/10"
                  aria-hidden
                >
                  <Icon className="h-5 w-5 text-sky" />
                </div>
                <p className="min-w-0 flex-1 pt-1.5 text-sm leading-relaxed text-charcoal/90">
                  <ConditionText item={item} t={t} />
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </TourSection>
  );
}
