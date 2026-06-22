import Link from "next/link";
import { cn } from "@/lib/cn";

export type PageBreadcrumbItem = {
  label: string;
  href?: string;
};

type PageBreadcrumbsProps = {
  items: PageBreadcrumbItem[];
  className?: string;
  variant?: "default" | "on-dark";
  separator?: "slash" | "dash";
};

export default function PageBreadcrumbs({
  items,
  className,
  variant = "default",
  separator = "slash",
}: PageBreadcrumbsProps) {
  const onDark = variant === "on-dark";
  const linkClass = onDark ? "transition-colors hover:text-white" : "transition-colors hover:text-sky";
  const currentClass = onDark ? "text-white" : "text-charcoal";
  const trailClass = onDark ? "text-white/75" : "text-slate";
  const sepClass = onDark ? "text-white/40" : "text-gray-300";
  const sep = separator === "dash" ? "–" : "/";

  return (
    <nav className={className} aria-label="Хлебные крошки">
      <ol className={cn("flex flex-wrap items-center text-sm", trailClass)}>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="inline-flex items-center">
            {index > 0 ? (
              <span className={cn("mx-2", sepClass)} aria-hidden>
                {sep}
              </span>
            ) : null}
            {item.href ? (
              <Link href={item.href} className={linkClass}>
                {item.label}
              </Link>
            ) : (
              <span className={currentClass}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
