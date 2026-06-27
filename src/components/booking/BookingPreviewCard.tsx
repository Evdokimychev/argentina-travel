"use client";

import type { LucideIcon } from "lucide-react";
import { CalendarDays, CircleDollarSign, ClipboardCheck, Clock3, Pencil, Users, UsersRound } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/cn";
import { formatExcursionDuration } from "@/lib/excursion-format";
import { addMinutesToScheduleTime } from "@/lib/excursion-schedule";

export type BookingPreviewField = {
  id: string;
  label: string;
  value: string;
  detail?: string;
  emphasize?: boolean;
  icon?: LucideIcon;
  onEdit?: () => void;
};

type BookingPreviewCardProps = {
  /** Section heading, e.g. «Предпросмотр заявки». */
  title?: string;
  description?: string;
  /** Excursion or tour cover image. */
  imageUrl?: string | null;
  /** Excursion or tour name shown beside the cover. */
  productTitle?: string;
  fields: BookingPreviewField[];
  priceLabel: string;
  priceHint?: string;
  className?: string;
};

/** Splits Tripster strings like "$150 за 3 человек" into amount + caption. */
export function parseBookingPreviewPriceLabel(
  priceLabel: string,
  options?: { stripFromPrefix?: boolean }
): {
  amount: string;
  caption?: string;
} {
  const trimmed = priceLabel.trim();
  if (!trimmed) return { amount: "—" };

  const match = trimmed.match(/^(.+?)\s+(за\s+.+\S.*)$/iu);
  let amount = match ? match[1].trim() : trimmed;

  if (options?.stripFromPrefix) {
    amount = amount.replace(/^(от|from|desde)\s+/i, "");
  }

  if (!match) return { amount };

  return {
    amount,
    caption: match[2].trim(),
  };
}

/** Single-line time row: range from slot end, or start + calculated end + duration hint. */
export function formatExcursionBookingPreviewTimeLabel(input: {
  startTime?: string | null;
  timeEnd?: string | null;
  durationMinutes?: number | null;
  t: (key: string) => string;
}): string {
  const { startTime, timeEnd, durationMinutes, t } = input;

  if (!startTime) return "—";

  if (timeEnd) {
    return `${startTime}–${timeEnd}`;
  }

  const durationLabel = formatExcursionDuration(durationMinutes ?? undefined, t);
  const calculatedEnd =
    durationMinutes && durationMinutes > 0
      ? addMinutesToScheduleTime(startTime, durationMinutes)
      : null;

  if (calculatedEnd && durationLabel) {
    return `${startTime} – ${calculatedEnd}, ≈ ${durationLabel}`;
  }

  if (durationLabel) {
    return `${startTime}, ≈ ${durationLabel}`;
  }

  return startTime;
}

function PreviewEditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="ml-auto shrink-0 rounded-lg p-1.5 text-slate transition-colors hover:bg-white hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
    >
      <Pencil className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}

function PreviewFieldRow({
  field,
  className,
}: {
  field: BookingPreviewField;
  className?: string;
}) {
  const Icon = field.icon;

  return (
    <div className={cn("flex min-w-0 items-start gap-2.5 px-3.5 py-3", className)}>
      {Icon ? (
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-sky/80" aria-hidden />
      ) : (
        <span className="w-4 shrink-0" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] leading-none text-slate">{field.label}</p>
        <p
          className={cn(
            "mt-1.5 leading-snug text-charcoal",
            field.emphasize
              ? "font-heading text-xl font-bold tabular-nums tracking-tight"
              : "text-sm font-semibold"
          )}
        >
          {field.value}
        </p>
        {field.detail ? (
          <p className="mt-0.5 text-xs leading-relaxed text-slate">{field.detail}</p>
        ) : null}
      </div>
      {field.onEdit ? (
        <PreviewEditButton
          label={`Изменить: ${field.label.toLowerCase()}`}
          onClick={field.onEdit}
        />
      ) : null}
    </div>
  );
}

function PreviewProductHeader({
  imageUrl,
  productTitle,
}: {
  imageUrl?: string | null;
  productTitle?: string;
}) {
  if (!imageUrl && !productTitle) return null;

  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5">
      {imageUrl ? (
        <div className="relative h-[4.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/[0.04]">
          <SafeImage
            src={imageUrl}
            alt={productTitle ?? ""}
            fill
            className="object-cover"
            sizes="88px"
          />
        </div>
      ) : null}
      {productTitle ? (
        <p className="min-w-0 flex-1 font-heading text-sm font-semibold leading-snug text-charcoal line-clamp-3">
          {productTitle}
        </p>
      ) : null}
    </div>
  );
}

export default function BookingPreviewCard({
  title = "Предпросмотр заявки",
  description,
  imageUrl,
  productTitle,
  fields,
  priceLabel,
  priceHint,
  className,
}: BookingPreviewCardProps) {
  const hasGuestsField = fields.some((field) => field.id === "guests");
  const { amount, caption } = parseBookingPreviewPriceLabel(priceLabel, {
    stripFromPrefix: hasGuestsField,
  });
  const priceDetailParts = [
    priceHint?.trim(),
    hasGuestsField && caption?.match(/^за\s+\d+/iu) ? undefined : caption?.trim(),
  ].filter(Boolean);
  const priceDetail = priceDetailParts.length > 0 ? priceDetailParts.join(" · ") : undefined;

  const priceField: BookingPreviewField = {
    id: "price",
    label: "Стоимость",
    value: amount,
    detail: priceDetail,
    emphasize: true,
    icon: CircleDollarSign,
  };

  return (
    <section
      aria-label={title}
      className={cn("overflow-hidden rounded-2xl border border-gray-100 bg-white", className)}
    >
      <div className="border-b border-gray-100 bg-gradient-to-r from-sky/[0.04] to-white px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-charcoal">{title}</h3>
            {description ? (
              <p className="mt-1 text-xs leading-relaxed text-slate">{description}</p>
            ) : null}
          </div>
        </div>
      </div>

      <PreviewProductHeader imageUrl={imageUrl} productTitle={productTitle} />

      <div className="grid divide-y divide-gray-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <dl className="divide-y divide-gray-100">
          {fields.map((field) => (
            <div key={field.id}>
              <PreviewFieldRow field={field} />
            </div>
          ))}
        </dl>

        <dl className="sm:flex sm:flex-col sm:justify-center">
          <div className="sm:flex-1">
            <PreviewFieldRow field={priceField} className="h-full bg-sky/[0.03] sm:min-h-full sm:py-4" />
          </div>
        </dl>
      </div>
    </section>
  );
}

export function excursionPreviewFields(input: {
  dateLabel: string;
  timeLabel: string;
  guestsLabel: string;
}): BookingPreviewField[] {
  return [
    { id: "date", label: "Дата", value: input.dateLabel, icon: CalendarDays },
    {
      id: "time",
      label: "Время",
      value: input.timeLabel,
      icon: Clock3,
    },
    { id: "guests", label: "Туристы", value: input.guestsLabel, icon: Users },
  ];
}

export function partnerTourPreviewFields(input: {
  dateLabel: string;
  guestsLabel: string;
  spotsLeft?: number;
  onEditDate?: () => void;
  onEditGuests?: () => void;
}): BookingPreviewField[] {
  const fields: BookingPreviewField[] = [
    {
      id: "date",
      label: "Дата заезда",
      value: input.dateLabel,
      icon: CalendarDays,
      onEdit: input.onEditDate,
    },
    {
      id: "guests",
      label: "Туристы",
      value: input.guestsLabel,
      icon: Users,
      onEdit: input.onEditGuests,
    },
  ];

  if (input.spotsLeft != null) {
    fields.push({
      id: "spots",
      label: "Свободно мест",
      value: String(input.spotsLeft),
      icon: UsersRound,
    });
  }

  return fields;
}
