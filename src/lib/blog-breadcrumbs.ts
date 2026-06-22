import {
  blogHubPath,
  getPrimaryBlogHubForPost,
  type BlogHub,
} from "@/data/blog-hubs";
import type { BreadcrumbJsonLdItem } from "@/lib/breadcrumb-json-ld";
import type { BlogPost } from "@/types";

export type BlogUiBreadcrumbItem = {
  label: string;
  href?: string;
};

export function buildBlogPostBreadcrumbJsonLd(post: BlogPost): BreadcrumbJsonLdItem[] {
  const items: BreadcrumbJsonLdItem[] = [
    { name: "Главная", path: "/" },
    { name: "Блог", path: "/blog" },
  ];

  const hub = getPrimaryBlogHubForPost(post);
  if (hub) {
    items.push({ name: hub.shortTitle, path: blogHubPath(hub.id) });
  }

  items.push({ name: post.title, path: `/blog/${post.slug}` });
  return items;
}

export function buildBlogPostUiBreadcrumbs(post: BlogPost): BlogUiBreadcrumbItem[] {
  const items: BlogUiBreadcrumbItem[] = [
    { label: "Главная", href: "/" },
    { label: "Блог", href: "/blog" },
  ];

  const hub = getPrimaryBlogHubForPost(post);
  if (hub) {
    items.push({ label: hub.shortTitle, href: blogHubPath(hub.id) });
  }

  items.push({ label: post.title });
  return items;
}

export function buildBlogHubBreadcrumbJsonLd(hub: BlogHub): BreadcrumbJsonLdItem[] {
  const path = blogHubPath(hub.id);
  return [
    { name: "Главная", path: "/" },
    { name: "Блог", path: "/blog" },
    { name: hub.title, path },
  ];
}
