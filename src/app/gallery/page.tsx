import GalleryPageView from "@/components/gallery/GalleryPageView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const PAGE_TITLE = "Галерея";
const PAGE_DESCRIPTION =
  "Фотографии из авторских туров по Аргентине: Патагония, Буэнос-Айрес, вино, Игуасу и другие регионы.";

export const metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/gallery",
});

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const { region } = await searchParams;

  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/gallery" />
      <GalleryPageView initialRegion={region} />
    </>
  );
}
