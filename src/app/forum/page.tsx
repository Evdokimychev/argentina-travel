import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ForumIndexView from "@/components/forum/ForumIndexView";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import { isSupabaseForumEnabled } from "@/lib/auth-mode";
import { buildTwoLevelBreadcrumbItems } from "@/lib/detail-breadcrumbs";
import { fetchForumCategories } from "@/lib/forum/forum-server";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_TITLE = "Форум";
const PAGE_DESCRIPTION =
  "Обсуждения о Буэнос-Айресе, иммиграции, турах и жизни в Аргентине. Открытые разделы доступны без регистрации.";

export const metadata: Metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/forum",
});

export default async function ForumPage() {
  if (!isSupabaseForumEnabled()) {
    notFound();
  }

  const locale = await getServerI18nLocale();
  const supabase = await createSupabaseServerClient();
  const categories = await fetchForumCategories(supabase);

  return (
    <>
      <BreadcrumbListJsonLd
        items={buildTwoLevelBreadcrumbItems(locale, {
          labelKey: "nav.forum",
          path: "/forum",
          fallback: PAGE_TITLE,
        })}
      />
      <ForumIndexView categories={categories} />
    </>
  );
}
