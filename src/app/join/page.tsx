import type { Metadata } from "next";
import JoinPageView from "@/components/join/JoinPageView";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { getPlaceCoverAlt, getPlaceCoverImage } from "@/lib/media-resolver";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Авторам путешествий",
  description:
    "Размещайте авторские туры по Аргентине на платформе «Пора в Аргентину». Бесплатное размещение, новый канал продаж и поддержка авторов.",
  path: "/join",
});

export default function JoinPage() {
  return (
    <JoinPageView
      heroImage={getPlaceCoverImage("perito-moreno-glacier")}
      heroImageAlt={getPlaceCoverAlt("perito-moreno-glacier")}
    />
  );
}
