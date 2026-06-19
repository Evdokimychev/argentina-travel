import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ExpertDetailView from "@/components/experts/ExpertDetailView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { expertHref, fetchExpertBySlug } from "@/lib/local-experts-server";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const expert = await fetchExpertBySlug(supabase, slug);

  if (!expert) {
    return { title: "Эксперт не найден" };
  }

  return {
    title: `${expert.name} — локальный эксперт`,
    description: expert.bio.slice(0, 160),
    alternates: buildHreflangAlternates(expertHref(slug)),
  };
}

export default async function ExpertDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const expert = await fetchExpertBySlug(supabase, slug);

  if (!expert) notFound();

  return (
    <>
      <WebPageJsonLd
        name={expert.name}
        description={expert.bio.slice(0, 200)}
        path={expertHref(slug)}
      />
      <ExpertDetailView expert={expert} />
    </>
  );
}
