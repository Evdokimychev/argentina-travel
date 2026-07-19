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
  /** Keeps long detail-page trails to one compact, scrollable line on phones. */
  compactOnMobile?: boolean;
};

export default function PageBreadcrumbs({
  items,
  className,
  variant = "default",
  separator = "slash",
  compactOnMobile = false,
}: PageBreadcrumbsProps) {
  const onDark = variant === "on-dark";
  const linkClass = onDark ? "transition-colors hover:text-white" : "transition-colors hover:text-sky";
  const currentClass = onDark ? "text-white" : "text-charcoal";
  const trailClass = onDark ? "text-white/75" : "text-slate";
  const sepClass = onDark ? "text-white/40" : "text-gray-300";
  const sep = separator === "dash" ? "–" : "/";

  return (
    <nav className={cn(compactOnMobile && "overflow-hidden", className)} aria-label="Хлебные крошки">
      <ol
        className={cn(
          "flex flex-wrap items-center text-sm",
          compactOnMobile &&
            "scrollbar-hide flex-nowrap overflow-x-auto whitespace-nowrap pb-1 [mask-image:linear-gradient(to_right,#000_0,#000_calc(100%-1.25rem),transparent_100%)] sm:flex-wrap sm:overflow-visible sm:whitespace-normal sm:pb-0 sm:[mask-image:none]",
          trailClass,
        )}
      >
        {items.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className={cn(
              "inline-flex shrink-0 items-center",
              compactOnMobile && index === items.length - 1 && "sr-only sm:not-sr-only sm:inline-flex",
            )}
          >
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
