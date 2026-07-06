import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ForumCategoryView from "@/components/forum/ForumCategoryView";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import { isSupabaseForumEnabled } from "@/lib/auth-mode";
import { buildDetailBreadcrumbItems } from "@/lib/detail-breadcrumbs";
import { fetchForumThreadsByCategorySlug } from "@/lib/forum/forum-server";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;

  if (!isSupabaseForumEnabled()) {
    return {};
  }

  const supabase = await createSupabaseServerClient();
  const result = await fetchForumThreadsByCategorySlug(supabase, slug);

  if (!result) {
    return {};
  }

  const { category } = result;
  const robots = category.publicRead ? undefined : { index: false, follow: false };

  return {
    ...buildPublicPageMetadata({
      title: `${category.title} — форум`,
      description: category.description ?? PAGE_FALLBACK_DESCRIPTION,
      path: `/forum/${category.slug}`,
    }),
    robots,
  };
}

const PAGE_FALLBACK_DESCRIPTION = "Обсуждения участников сообщества «Пора в Аргентину».";

export default async function ForumCategoryPage({ params }: PageProps) {
  if (!isSupabaseForumEnabled()) {
    notFound();
  }

  const { category: slug } = await params;
  const locale = await getServerI18nLocale();
  const supabase = await createSupabaseServerClient();
  const result = await fetchForumThreadsByCategorySlug(supabase, slug);

  if (!result) {
    notFound();
  }

  return (
    <>
      <BreadcrumbListJsonLd
        items={buildDetailBreadcrumbItems(locale, "forum", {
          name: result.category.title,
          path: `/forum/${result.category.slug}`,
        })}
      />
      <ForumCategoryView category={result.category} threads={result.threads} />
    </>
  );
}
