"use client";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  if (variant === "comfort") return "bg-success";
  if (scale >= 5) return "bg-error";
  if (scale >= 4) return "bg-warning";
  if (scale >= 3) return "bg-sky";
  if (scale >= 2) return "bg-sun";
  return "bg-success";
}

function iconTone(variant: InfoModalVariant, scale: number): string {
  if (variant === "comfort") {
    if (scale >= 5) return "bg-success-muted text-success";
    if (scale >= 4) return "bg-success-muted/70 text-success";
    if (scale >= 3) return "bg-sky/10 text-sky-dark";
    if (scale >= 2) return "bg-sky/10 text-sky";
    return "bg-surface-muted text-slate";
  }
  if (scale >= 5) return "bg-error-muted text-error";
  if (scale >= 4) return "bg-warning-muted text-warning";
  if (scale >= 3) return "bg-sky/10 text-sky";
  if (scale >= 2) return "bg-sun/15 text-charcoal";
  return "bg-success-muted text-success";
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
  const icons = variant === "difficulty" ? DIFFICULTY_ICONS : COMFORT_ICONS;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="flex max-h-[85vh] max-w-md flex-col overflow-hidden border border-gray-100 p-0"
        onPointerDownOutside={onClose}
        onEscapeKeyDown={onClose}
      >
        <DialogHeader className="flex-row items-start justify-between gap-4 border-b border-gray-100">
          <div className="min-w-0 flex-1">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="sr-only">
              {hint ?? DEFAULT_HINTS[variant]}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate transition-colors hover:bg-gray-100 hover:text-charcoal"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">
          <p className="mb-5 rounded-xl border border-gray-100 bg-surface-muted/60 px-3 py-2.5 text-xs leading-relaxed text-slate">
            {hint ?? DEFAULT_HINTS[variant]}
          </p>

          <ul className="space-y-3">
            {items.map((item) => {
              const Icon = icons[item.level] ?? Mountain;
              const isHighlighted = highlightLevel === item.level;

              return (
                <li
                  key={item.level}
                  className={cn(
                    "rounded-xl border p-4 transition-colors",
                    isHighlighted
                      ? "border-sky/30 bg-white shadow-card ring-2 ring-sky/15"
                      : "border-gray-100 bg-white"
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
                          <span className="rounded-full bg-sky/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky">
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

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 text-xs text-slate">
            <span>Шкала:</span>
            <LevelScaleDots scale={1} variant={variant} />
            <span aria-hidden>→</span>
            <LevelScaleDots scale={5} variant={variant} />
            <span className="text-slate/70">
              {variant === "comfort" ? "базовый → люкс" : "лёгкая → экстремальная"}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SectionHeading({
  title,
  subtitle,
  variant = "default",
}: {
  title: string;
  subtitle?: string;
  variant?: "default" | "card";
}) {
  return (
    <header className={cn(variant === "card" ? "mb-6 border-b border-gray-100 pb-4" : "mb-6")}>
      <h2 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">{title}</h2>
      {subtitle ? (
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate">{subtitle}</p>
      ) : null}
    </header>
  );
}

export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-slate transition-colors hover:border-sky hover:text-sky"
      aria-label="Подробнее"
    >
      ?
    </button>
  );
}
