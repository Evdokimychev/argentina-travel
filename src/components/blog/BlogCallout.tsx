import {
  AlertTriangle,
  Info,
  Lightbulb,
  Sparkles,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { CALLOUT_LABELS } from "@/lib/blog-section-body";
import type { BlogCalloutVariant } from "@/types/blog-content-blocks";

const CALLOUT_CONFIG: Record<
  BlogCalloutVariant,
  { border: string; bg: string; icon: LucideIcon; iconClass: string; labelClass: string }
> = {
  important: {
    border: "border-sky/30",
    bg: "bg-sky/[0.09]",
    icon: Info,
    iconClass: "text-[#3d6a99]",
    labelClass: "text-[#2d5478]",
  },
  tip: {
    border: "border-emerald-200/80",
    bg: "bg-emerald-50/80",
    icon: Lightbulb,
    iconClass: "text-emerald-800",
    labelClass: "text-emerald-950",
  },
  hack: {
    border: "border-violet-200/80",
    bg: "bg-violet-50/70",
    icon: Sparkles,
    iconClass: "text-violet-800",
    labelClass: "text-violet-950",
  },
  know: {
    border: "border-gray-200",
    bg: "bg-surface-muted/90",
    icon: Info,
    iconClass: "text-charcoal/80",
    labelClass: "text-charcoal",
  },
  mistake: {
    border: "border-red-200/80",
    bg: "bg-red-50/60",
    icon: XCircle,
    iconClass: "text-red-800",
    labelClass: "text-red-950",
  },
  warning: {
    border: "border-amber-200/80",
    bg: "bg-amber-50/80",
    icon: AlertTriangle,
    iconClass: "text-amber-900",
    labelClass: "text-amber-950",
  },
};

type BlogCalloutProps = {
  variant: BlogCalloutVariant;
  title?: string;
  body: string;
  className?: string;
};

export default function BlogCallout({ variant, title, body, className }: BlogCalloutProps) {
  const config = CALLOUT_CONFIG[variant];
  const Icon = config.icon;
  const label = title ?? CALLOUT_LABELS[variant];

  return (
    <aside
      className={cn(
        "rounded-2xl border p-4 shadow-sm sm:p-5",
        config.border,
        config.bg,
        className,
      )}
      role="note"
      aria-label={label}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", config.iconClass)} aria-hidden />
        <div className="min-w-0">
          <p className={cn("font-heading text-sm font-bold", config.labelClass)}>{label}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-charcoal/85 sm:text-[0.9375rem]">
            {body}
          </p>
        </div>
      </div>
    </aside>
  );
}

export { CALLOUT_CONFIG };
