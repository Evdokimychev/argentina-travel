import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  tokenCardInteractiveClass,
  tokenCardSurfaceClass,
} from "@/lib/design-tokens";

/**
 * Оверлей-карточка каталога (текст поверх фото) — единый вид для «Мест» и «Регионов».
 *
 * Делит один и тот же shell с ContentCard (rounded-card / border-border-subtle /
 * bg-surface-elevated / shadow-card / card-hover), поэтому «Места», «Регионы», блог
 * и база знаний выглядят как один набор карточек. Здесь — атомы для варианта «оверлей»;
 * стековый вариант (медиа сверху, тело снизу) живёт в ContentCard.tsx.
 *
 * Модуль без "use client": презентационный, безопасно рендерится и на сервере
 * (страница «Регионы» — серверный компонент), и на клиенте (PlaceCard — клиентский).
 */

/** Shell оверлей-карточки: тот же токен-каркас, что и у ContentCard. */
export const overlayCardShellClass = cn(
  "group relative flex h-full flex-col overflow-hidden",
  tokenCardSurfaceClass,
  tokenCardInteractiveClass,
  "hover:-translate-y-0.5",
);

/** Тёмный градиент снизу — читаемость белого текста поверх фото. */
export const overlayGradientClass =
  "pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/25 to-transparent";

/** Плавный zoom обложки на ховере (отключён при prefers-reduced-motion). */
export const overlayMediaHoverClass =
  "object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transform-none";

/** Ссылка-обёртка оверлей-карточки (вся карточка кликабельна). */
export function OverlayCardLink({
  href,
  ariaLabel,
  className,
  children,
}: {
  href: string;
  ariaLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} aria-label={ariaLabel} className={cn(overlayCardShellClass, className)}>
      {children}
    </Link>
  );
}

/** Пилюля категории/группы в левом верхнем углу медиа. */
export function OverlayTopPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-pill bg-white/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-white backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Мелкий чип метаданных (рейтинг/длительность/сезон) поверх фото. */
export function OverlayMetaChip({
  icon: Icon,
  iconClassName,
  children,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 backdrop-blur-sm">
      <Icon className={cn("h-3 w-3", iconClassName)} aria-hidden />
      {children}
    </span>
  );
}
