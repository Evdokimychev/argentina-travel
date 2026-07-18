import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ExpertDetailView from "@/components/experts/ExpertDetailView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import { expertHref, fetchExpertBySlug } from "@/lib/local-experts-server";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { createSupabaseServerClientIfConfigured } from "@/lib/supabase/server";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createSupabaseServerClientIfConfigured();
  const expert = await fetchExpertBySlug(supabase, slug);

  if (!expert) {
    return { title: "Эксперт не найден" };
  }

  const isGuide = expert.categories.includes("guide");
  const isRussianSpeaking = expert.languages.some((language) =>
    /^(ru|rus|russian|русский)$/i.test(language.trim()),
  );
  const role = isGuide ? "гид" : "локальный эксперт";
  const title = `${expert.name} — ${isRussianSpeaking ? "русскоязычный " : ""}${role} в ${expert.city}`;
  const description = `${title}. ${expert.bio}`;
  const metadata = buildPublicPageMetadata({
    title,
    description,
    path: expertHref(slug),
    image: expert.avatarUrl ?? undefined,
  });

  return {
    ...metadata,
    alternates: {
      ...buildHreflangAlternates(expertHref(slug)),
      ...metadata.alternates,
    },
  };
}

export default async function ExpertDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClientIfConfigured();
  const expert = await fetchExpertBySlug(supabase, slug);

  if (!expert) notFound();

  return (
    <>
      <WebPageJsonLd
        name={expert.name}
        description={expert.bio.slice(0, 200)}
        path={expertHref(slug)}
      />
      <BreadcrumbListJsonLd
        items={[
          { name: "Главная", path: "/" },
          { name: "Гиды и эксперты", path: "/experts" },
          { name: expert.name, path: expertHref(slug) },
        ]}
      />
      <ExpertDetailView expert={expert} />
    </>
  );
}
