import Link from "next/link";
import PageBreadcrumbs from "@/components/navigation/PageBreadcrumbs";
import type { BlogUiBreadcrumbItem } from "@/lib/blog-breadcrumbs";

type BlogPostBreadcrumbsProps = {
  items: BlogUiBreadcrumbItem[];
  className?: string;
};

export default function BlogPostBreadcrumbs({ items, className }: BlogPostBreadcrumbsProps) {
  return <PageBreadcrumbs items={items} className={className} />;
}
