import { Suspense } from "react";
import AudioGuidesCatalogView from "@/components/audio-guides/AudioGuidesCatalogView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const PAGE_TITLE = "Аудиогиды по Аргентине";
const PAGE_DESCRIPTION =
  "Аудиоэкскурсии по Буэнос-Айресу и другим городам через партнёра WeGoTrip. Слушайте маршрут в приложении в удобном темпе.";

export const metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/audio-guides",
});

export default function AudioGuidesPage() {
  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/audio-guides" />
      <Suspense fallback={null}>
        <AudioGuidesCatalogView />
      </Suspense>
    </>
  );
}
