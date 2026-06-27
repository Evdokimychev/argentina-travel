import { Suspense } from "react";
import type { Metadata } from "next";
import ExpertsCatalog from "@/components/experts/ExpertsCatalog";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { fetchPublishedExperts } from "@/lib/local-experts-server";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { createSupabaseServerClientIfConfigured } from "@/lib/supabase/server";
import { siteContainerClass } from "@/lib/site-container";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Локальные эксперты — гиды и консультанты в Аргентине",
    description:
      "Каталог локальных экспертов: гиды, консультанты по переезду, фотографы. Фильтры по городу, категории и языку.",
    alternates: buildHreflangAlternates("/experts"),
  };
}

export default async function ExpertsPage() {
  const supabase = await createSupabaseServerClientIfConfigured();
  const experts = await fetchPublishedExperts(supabase);

  return (
    <>
      <WebPageJsonLd
        name="Локальные эксперты"
        description="Каталог гидов и консультантов в Аргентине"
        path="/experts"
      />
      <Suspense
        fallback={
          <div className={`${siteContainerClass} py-24 text-center text-slate`}>
            Загрузка каталога…
          </div>
        }
      >
        <ExpertsCatalog experts={experts} />
      </Suspense>
    </>
  );
}
