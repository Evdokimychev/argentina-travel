import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, buttonVariants } from "@/components/ui/button";

export type EmptyStateVariant = "catalog" | "cabinet" | "admin";

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  /** Алиасы Button: outline/default → outline, secondary → outline */
  variant?: "primary" | "secondary" | "outline" | "default";
}

function resolveActionButtonVariant(
  variant: EmptyStateAction["variant"] = "primary"
): "primary" | "secondary" | "outline" | "default" {
  if (variant === "secondary" || variant === "outline") return "outline";
  if (variant === "default") return "default";
  return "primary";
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  bordered?: boolean;
  variant?: EmptyStateVariant;
  compact?: boolean;
}

const VARIANT_STYLES: Record<
  EmptyStateVariant,
  { root: string; icon: string; title: string; description: string }
> = {
  catalog: {
    root: "px-6 py-14 sm:py-16",
    icon: "h-12 w-12",
    title: "text-base sm:text-lg",
    description: "text-sm sm:text-base",
  },
  cabinet: {
    root: "px-6 py-10 sm:py-12",
    icon: "h-10 w-10",
    title: "text-base",
    description: "text-sm",
  },
  admin: {
    root: "px-4 py-8 sm:px-6 sm:py-10",
    icon: "h-9 w-9",
    title: "text-sm sm:text-base",
    description: "text-sm",
  },
};

function EmptyStateActionButton({ action }: { action: EmptyStateAction }) {
  const variant = resolveActionButtonVariant(action.variant);

  if (action.href) {
    return (
      <Link href={action.href} className={buttonVariants({ variant, size: "sm" })}>
        {action.label}
      </Link>
    );
  }

  return (
    <Button type="button" variant={variant} size="sm" onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  bordered = true,
  variant = "catalog",
  compact = false,
}: EmptyStateProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={cn(
        "text-center",
        compact ? "px-4 py-6" : styles.root,
        bordered && !compact && "rounded-2xl border border-dashed border-gray-200 bg-surface-muted/40",
        compact && "rounded-xl",
        className
      )}
    >
      <Icon
        className={cn("mx-auto text-slate/50", compact ? "h-8 w-8" : styles.icon)}
        strokeWidth={1.5}
        aria-hidden
      />
      <p className={cn("mt-4 font-medium text-charcoal", compact ? "text-sm" : styles.title)}>
        {title}
      </p>
      {description ? (
        <p className={cn("mt-2 text-slate", compact ? "text-xs" : styles.description)}>
          {description}
        </p>
      ) : null}
      {action || secondaryAction ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {action ? <EmptyStateActionButton action={action} /> : null}
          {secondaryAction ? (
            <EmptyStateActionButton action={{ ...secondaryAction, variant: "secondary" }} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
