import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, buttonVariants } from "@/components/ui/button";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline";
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  bordered?: boolean;
}

function EmptyStateActionButton({ action }: { action: EmptyStateAction }) {
  const variant = action.variant ?? "default";

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
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "px-6 py-12 text-center",
        bordered && "rounded-2xl border border-dashed border-gray-200 bg-surface-muted/40",
        className
      )}
    >
      <Icon className="mx-auto h-10 w-10 text-slate/50" strokeWidth={1.5} aria-hidden />
      <p className="mt-4 font-medium text-charcoal">{title}</p>
      {description ? <p className="mt-2 text-sm text-slate">{description}</p> : null}
      {action || secondaryAction ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {action ? <EmptyStateActionButton action={action} /> : null}
          {secondaryAction ? (
            <EmptyStateActionButton action={{ ...secondaryAction, variant: "outline" }} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
