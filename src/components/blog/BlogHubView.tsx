import Link from "next/link";
import { ArrowRight } from "lucide-react";
import BlogHubCatalog from "@/components/blog/BlogHubCatalog";
import BlogHubPinnedNav from "@/components/blog/BlogHubPinnedNav";
import HubHero from "@/components/guide/hub/HubHero";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import {
  blogHubPath,
  countBlogHubPosts,
  getBlogHubPinnedPosts,
  getBlogHubPosts,
  type BlogHub,
} from "@/data/blog-hubs";
import { blogPosts } from "@/data/blog";
import { buildBlogHubBreadcrumbJsonLd } from "@/lib/blog-breadcrumbs";
import { pluralizeArticles } from "@/lib/blog-utils";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";
import type { BlogPost } from "@/types";

type BlogHubViewProps = {
  hub: BlogHub;
  posts?: BlogPost[];
};

export default function BlogHubView({ hub, posts = blogPosts }: BlogHubViewProps) {
  const hubPosts = getBlogHubPosts(hub, posts);
  const pinnedPosts = getBlogHubPinnedPosts(hub, posts);
  const path = blogHubPath(hub.id);
  const total = countBlogHubPosts(hub, posts);

  return (
    <>
      <WebPageJsonLd name={hub.title} description={hub.seoDescription} path={path} />
      <BreadcrumbListJsonLd items={buildBlogHubBreadcrumbJsonLd(hub)} />

      <HubHero
        title={hub.title}
        subtitle={hub.description}
        image={hub.image}
        eyebrow={{ label: "Блог", href: "/blog" }}
        ctas={[
          ...(hub.cta
            ? [{ label: hub.cta.label, href: hub.cta.href, variant: "primary" as const }]
            : []),
          { label: "Все статьи", href: "/blog", variant: "secondary" as const },
        ]}
      />

      <div className="bg-surface-muted pb-16">
        <div className={cn(siteContainerClass, "py-8 md:py-10")}>
          <nav className="text-sm text-slate" aria-label="Хлебные крошки">
            <Link href="/" className="hover:text-sky">
              Главная
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <Link href="/blog" className="hover:text-sky">
              Блог
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-charcoal">{hub.shortTitle}</span>
          </nav>

          <p className="mt-6 text-sm text-slate">{pluralizeArticles(total)} в подборке</p>

          <BlogHubPinnedNav posts={pinnedPosts} />

          {hubPosts.length > 0 ? (
            <BlogHubCatalog hub={hub} posts={hubPosts} />
          ) : (
            <p className="mt-8 rounded-panel border border-dashed border-border-subtle bg-surface-elevated p-10 text-center text-slate">
              Материалы подборки скоро появятся. Пока загляните в{" "}
              <Link href="/blog" className="font-medium text-sky hover:underline">
                каталог блога
              </Link>
              .
            </p>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/blog" className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-6")}>
              Каталог блога
            </Link>
            {hub.cta ? (
              <Link href={hub.cta.href} className={cn(buttonVariants(), "rounded-full px-6")}>
                {hub.cta.label}
                <ArrowRight className="ml-1 inline h-4 w-4" aria-hidden />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
