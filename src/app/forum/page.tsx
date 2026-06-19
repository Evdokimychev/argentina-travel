import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ForumIndexView from "@/components/forum/ForumIndexView";
import { isSupabaseForumEnabled } from "@/lib/auth-mode";
import { fetchForumCategories } from "@/lib/forum/forum-server";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_TITLE = "Форум — Пора в Аргентину";
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

  const supabase = await createSupabaseServerClient();
  const categories = await fetchForumCategories(supabase);

  return <ForumIndexView categories={categories} />;
}
