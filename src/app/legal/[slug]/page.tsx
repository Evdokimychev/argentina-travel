import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegalPageView from "@/components/legal/LegalPageView";
import { resolveLegalDocument, listPublishedLegalSlugs } from "@/lib/cms/legal-resolver";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await listPublishedLegalSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = await resolveLegalDocument(slug);
  if (!doc) return { title: "Документ" };
  return buildPublicPageMetadata({
    title: doc.title,
    description: doc.description,
    path: `/legal/${slug}`,
  });
}

export default async function LegalDocumentPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = await resolveLegalDocument(slug);
  if (!doc) notFound();
  return <LegalPageView document={doc} />;
}
