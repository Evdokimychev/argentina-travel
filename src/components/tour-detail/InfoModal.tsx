"use client";

import { useEffect } from "react";
import {
  X,
  Bus,
  Footprints,
  Mountain,
  MountainSnow,
  Flame,
  Tent,
  Building2,
  BedDouble,
  Sparkles,
  Crown,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

export type InfoModalVariant = "difficulty" | "comfort";

export interface InfoModalItem {
  level: string;
  description: string;
  /** Filled segments on the scale (1–5) */
  scale: number;
}

interface InfoModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  variant: InfoModalVariant;
  items: InfoModalItem[];
  /** Highlights the row matching the current tour level */
  highlightLevel?: string;
  hint?: string;
}

const DEFAULT_HINTS: Record<InfoModalVariant, string> = {
  difficulty:
    "Описания уровней ориентировочные. Фактическая нагрузка зависит от маршрута и условий.",
  comfort:
    "Варианты проживания указаны для ознакомления. Реальное размещение зависит от программы тура.",
};

const DIFFICULTY_ICONS: Record<string, LucideIcon> = {
  Лёгкая: Bus,
  Умеренная: Footprints,
  Средняя: Mountain,
  Высокая: MountainSnow,
  Экстремальная: Flame,
};

const COMFORT_ICONS: Record<string, LucideIcon> = {
  "Без проживания": Sun,
  Базовый: Tent,
  Стандарт: Building2,
  Комфорт: BedDouble,
  Премиум: Sparkles,
  Люкс: Crown,
};

function scaleColor(variant: InfoModalVariant, scale: number): string {
  if (variant === "comfort") return "bg-emerald-500";
  if (scale >= 5) return "bg-red-500";
  if (scale >= 4) return "bg-orange-500";
  if (scale >= 3) return "bg-brand";
  if (scale >= 2) return "bg-amber-400";
  return "bg-emerald-500";
}

function iconTone(variant: InfoModalVariant, scale: number): string {
  if (variant === "comfort") {
    if (scale >= 5) return "bg-emerald-100 text-emerald-700";
    if (scale >= 4) return "bg-emerald-50 text-emerald-600";
    if (scale >= 3) return "bg-teal-50 text-teal-600";
    if (scale >= 2) return "bg-sky/15 text-sky";
    return "bg-gray-100 text-slate";
  }
  if (scale >= 5) return "bg-red-50 text-red-600";
  if (scale >= 4) return "bg-orange-50 text-orange-600";
  if (scale >= 3) return "bg-brand/10 text-brand";
  if (scale >= 2) return "bg-amber-50 text-amber-600";
  return "bg-emerald-50 text-emerald-600";
}

function LevelScaleBar({
  scale,
  variant,
  total = 5,
}: {
  scale: number;
  variant: InfoModalVariant;
  total?: number;
}) {
  const color = scaleColor(variant, scale);

  return (
    <div
      className="flex w-full gap-1"
      role="img"
      aria-label={`Уровень ${scale} из ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            i < scale ? color : "bg-gray-200/80"
          )}
        />
      ))}
    </div>
  );
}

function LevelScaleDots({
  scale,
  variant,
  total = 5,
}: {
  scale: number;
  variant: InfoModalVariant;
  total?: number;
}) {
  const color = scaleColor(variant, scale);

  return (
    <span className="inline-flex shrink-0 items-center gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-2 rounded-full",
            i < scale ? color : "bg-gray-200"
          )}
        />
      ))}
    </span>
  );
}

export default function InfoModal({
  open,
  onClose,
  title,
  variant,
  items,
  highlightLevel,
  hint,
}: InfoModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const icons = variant === "difficulty" ? DIFFICULTY_ICONS : COMFORT_ICONS;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-charcoal/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-sky/20 bg-[#f0f7ff] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <h3 id="info-modal-title" className="font-display text-xl font-bold text-charcoal">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-slate shadow-sm transition-colors hover:bg-white hover:text-charcoal"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6">
          <p className="mb-5 rounded-xl border border-sky/15 bg-white/60 px-3 py-2.5 text-xs leading-relaxed text-slate">
            {hint ?? DEFAULT_HINTS[variant]}
          </p>

          <ul className="space-y-4">
            {items.map((item) => {
              const Icon = icons[item.level] ?? Mountain;
              const isHighlighted = highlightLevel === item.level;

              return (
                <li
                  key={item.level}
                  className={cn(
                    "rounded-xl border p-4 transition-colors",
                    isHighlighted
                      ? "border-brand/30 bg-white shadow-sm ring-2 ring-brand/20"
                      : "border-sky/15 bg-white/70"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        iconTone(variant, item.scale)
                      )}
                    >
                      <Icon className="h-5 w-5 stroke-[1.75]" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="font-semibold text-charcoal">{item.level}</p>
                        {isHighlighted && (
                          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                            Этот тур
                          </span>
                        )}
                        <LevelScaleDots scale={item.scale} variant={variant} />
                      </div>

                      <div className="mt-2.5">
                        <LevelScaleBar scale={item.scale} variant={variant} />
                      </div>

                      <p className="mt-2.5 text-sm leading-relaxed text-slate">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-sky/15 pt-4 text-xs text-slate">
            <span>Шкала:</span>
            <LevelScaleDots scale={1} variant={variant} />
            <span aria-hidden>→</span>
            <LevelScaleDots scale={5} variant={variant} />
            <span className="text-slate/70">
              {variant === "comfort" ? "базовый → люкс" : "лёгкая → экстремальная"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">
        {title}
      </h2>
      {subtitle && <p className="mt-2 text-slate">{subtitle}</p>}
    </div>
  );
}

export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-slate hover:border-sky hover:text-sky"
      aria-label="Подробнее"
    >
      ?
    </button>
  );
}
