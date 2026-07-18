import { Suspense } from "react";
import type { Metadata } from "next";
import ExpertsCatalog from "@/components/experts/ExpertsCatalog";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import CommercialSeoSection from "@/components/seo/CommercialSeoSection";
import { fetchPublishedExperts } from "@/lib/local-experts-server";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { createSupabaseServerClientIfConfigured } from "@/lib/supabase/server";
import { siteContainerClass } from "@/lib/site-container";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import {
  EXPERTS_CATALOG_SEO,
  hasCommercialFilterParams,
} from "@/lib/commercial-catalog-seo";

type ExpertsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: ExpertsPageProps): Promise<Metadata> {
  const query = await searchParams;
  const metadata = buildPublicPageMetadata({
    title: "Русскоязычные гиды и эксперты в Аргентине",
    description:
      "Русскоязычные гиды и местные эксперты в Аргентине: выбирайте город, язык и специализацию, изучайте профиль и отправляйте запрос напрямую.",
    path: "/experts",
  });
  return {
    ...metadata,
    alternates: {
      ...buildHreflangAlternates("/experts"),
      ...metadata.alternates,
    },
    ...(hasCommercialFilterParams(query) ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ExpertsPage() {
  const supabase = await createSupabaseServerClientIfConfigured();
  const experts = await fetchPublishedExperts(supabase);

  return (
    <>
      <WebPageJsonLd
        name="Русскоязычные гиды и эксперты в Аргентине"
        description="Каталог местных гидов и специалистов с фильтрами по городу, языку и направлению помощи"
        path="/experts"
      />
      <BreadcrumbListJsonLd
        items={[
          { name: "Главная", path: "/" },
          { name: "Гиды и эксперты", path: "/experts" },
        ]}
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
      <CommercialSeoSection copy={EXPERTS_CATALOG_SEO} />
    </>
  );
}
