import Link from "next/link";
import type { BlogUiBreadcrumbItem } from "@/lib/blog-breadcrumbs";

type BlogPostBreadcrumbsProps = {
  items: BlogUiBreadcrumbItem[];
  className?: string;
};

export default function BlogPostBreadcrumbs({ items, className }: BlogPostBreadcrumbsProps) {
  return (
    <nav className={className} aria-label="Хлебные крошки">
      <ol className="flex flex-wrap items-center text-sm text-slate">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="inline-flex items-center">
            {index > 0 ? <span className="mx-2 text-gray-300" aria-hidden>/</span> : null}
            {item.href ? (
              <Link href={item.href} className="hover:text-sky">
                {item.label}
              </Link>
            ) : (
              <span className="text-charcoal">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
