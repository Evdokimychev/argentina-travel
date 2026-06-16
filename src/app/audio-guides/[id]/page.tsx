import { notFound } from "next/navigation";
import AudioGuideDetailView from "@/components/audio-guides/AudioGuideDetailView";
import { getWeGoTripProductById } from "@/lib/wegottrip/client";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const productId = Number.parseInt(id, 10);
  if (!Number.isFinite(productId)) return {};

  const product = await getWeGoTripProductById({ productId, locale: "ru", currency: "USD" });
  if (!product) return {};

  return buildPublicPageMetadata({
    title: `${product.title} — аудиогид`,
    description: product.description.slice(0, 160) || product.title,
    path: `/audio-guides/${productId}`,
  });
}

export default async function AudioGuideDetailPage({ params }: PageProps) {
  const { id } = await params;
  const productId = Number.parseInt(id, 10);
  if (!Number.isFinite(productId)) notFound();

  return <AudioGuideDetailView productId={productId} />;
}
