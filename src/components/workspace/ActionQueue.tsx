import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ActionQueueItem = {
  id: string;
  title: string;
  description?: string;
  href: string;
  label?: string;
  count?: number;
  priority?: "high" | "medium" | "low";
  icon?: LucideIcon;
};

export function ActionQueue({
  title,
  description,
  items,
  emptyTitle = "Срочных задач нет",
  emptyDescription = "Все важные действия на сегодня выполнены.",
  className,
}: {
  title: string;
  description?: string;
  items: ActionQueueItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border-subtle bg-surface-elevated p-5 shadow-card sm:p-6", className)}>
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>

      {items.length > 0 ? (
        <ol className="mt-4 divide-y divide-border-subtle">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="group flex min-h-16 items-center gap-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      item.priority === "high"
                        ? "bg-error-muted text-error"
                        : item.priority === "medium"
                          ? "bg-warning-muted text-warning"
                          : "bg-sky/10 text-sky",
                    )}
                  >
                    {Icon ? <Icon className="h-4 w-4" aria-hidden /> : <span className="text-sm font-bold">{item.count ?? 1}</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                    {item.description ? <span className="mt-0.5 block text-xs text-muted">{item.description}</span> : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-sky">
                    <span className="hidden sm:inline">{item.label ?? "Открыть"}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-success-muted px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-foreground">{emptyTitle}</p>
            <p className="mt-0.5 text-xs text-muted">{emptyDescription}</p>
          </div>
        </div>
      )}
    </section>
  );
}
