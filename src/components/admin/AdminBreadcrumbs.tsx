"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { resolveAdminBreadcrumbs } from "@/lib/admin/breadcrumbs";
import { cn } from "@/lib/cn";

export default function AdminBreadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const crumbs = resolveAdminBreadcrumbs(pathname);

  if (crumbs.length <= 1 && crumbs[0]?.label === "Панель") {
    return null;
  }

  return (
    <nav aria-label="Навигация" className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-slate">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate/50" aria-hidden />
              ) : null}
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="rounded-md px-0.5 transition-colors hover:text-sky hover:underline"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    isLast ? "font-medium text-charcoal" : "text-slate"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
