import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegalPageView from "@/components/legal/LegalPageView";
import { LEGAL_DOCUMENTS } from "@/data/legal-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return Object.keys(LEGAL_DOCUMENTS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = LEGAL_DOCUMENTS[slug];
  if (!doc) return { title: "Документ" };
  return {
    title: doc.title,
    description: doc.description,
  };
}

export default async function LegalDocumentPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = LEGAL_DOCUMENTS[slug];
  if (!doc) notFound();
  return <LegalPageView document={doc} />;
}
