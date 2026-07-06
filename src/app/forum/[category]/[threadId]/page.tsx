import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ForumThreadView from "@/components/forum/ForumThreadView";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import { isSupabaseForumEnabled } from "@/lib/auth-mode";
import { buildForumThreadBreadcrumbItems } from "@/lib/detail-breadcrumbs";
import {
  fetchForumCategoryBySlug,
  fetchForumThreadDetail,
} from "@/lib/forum/forum-server";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ category: string; threadId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug, threadId } = await params;

  if (!isSupabaseForumEnabled()) {
    return {};
  }

  const supabase = await createSupabaseServerClient();
  const [category, thread] = await Promise.all([
    fetchForumCategoryBySlug(supabase, slug),
    fetchForumThreadDetail(supabase, slug, threadId),
  ]);

  if (!category || !thread) {
    return {};
  }

  const firstPost = thread.posts[0]?.body ?? "";
  const description =
    firstPost.slice(0, 160).trim() || `Обсуждение в разделе «${category.title}».`;

  return {
    ...buildPublicPageMetadata({
      title: `${thread.title} — форум`,
      description,
      path: `/forum/${slug}/${threadId}`,
    }),
    robots: category.publicRead ? undefined : { index: false, follow: false },
  };
}

export default async function ForumThreadPage({ params }: PageProps) {
  if (!isSupabaseForumEnabled()) {
    notFound();
  }

  const { category: slug, threadId } = await params;
  const locale = await getServerI18nLocale();
  const supabase = await createSupabaseServerClient();
  const thread = await fetchForumThreadDetail(supabase, slug, threadId);

  if (!thread) {
    notFound();
  }

  return (
    <>
      <BreadcrumbListJsonLd
        items={buildForumThreadBreadcrumbItems(
          locale,
          { title: thread.categoryTitle, slug: thread.categorySlug },
          { title: thread.title, path: `/forum/${slug}/${threadId}` },
        )}
      />
      <ForumThreadView thread={thread} />
    </>
  );
}
