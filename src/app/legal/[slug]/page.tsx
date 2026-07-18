import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TranslationPreparingBanner from "@/components/i18n/TranslationPreparingBanner";
import LegalPageView from "@/components/legal/LegalPageView";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import { getCmsResolverMetadata } from "@/lib/cms/content-resolver";
import { resolveLegalDocument, listPublishedLegalSlugs } from "@/lib/cms/legal-resolver";
import { buildCmsContentHreflangAlternates } from "@/lib/cms/cms-hreflang";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { buildCmsPageMetadata } from "@/lib/cms/cms-page-metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await listPublishedLegalSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getServerI18nLocale();
  const doc = await resolveLegalDocument(slug, locale);
  if (!doc) return { title: "Документ" };
  const alternates = await buildCmsContentHreflangAlternates("legal", slug, locale);
  return buildCmsPageMetadata({
    content: doc,
    title: doc.title,
    description: doc.description,
    path: `/legal/${slug}`,
    alternates,
  });
}

export default async function LegalDocumentPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getServerI18nLocale();
  const doc = await resolveLegalDocument(slug, locale);
  if (!doc) notFound();
  const cmsMetadata = getCmsResolverMetadata(doc);
  return (
    <>
      {cmsMetadata?.showTranslationBanner ? (
        <TranslationPreparingBanner locale={cmsMetadata.requestedLocale} />
      ) : null}
      <BreadcrumbListJsonLd
        items={[
          { name: "Главная", path: "/" },
          { name: doc.title, path: `/legal/${slug}` },
        ]}
      />
      <LegalPageView document={doc} />
    </>
  );
}
