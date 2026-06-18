import type { Metadata } from "next";
import GuideHubView from "@/components/guide/GuideHubView";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Путеводитель по Аргентине — Пора в Аргентину",
  description:
    "14 тем для планирования поездки: перелёты, регионы, деньги, культура и безопасность — с турами, сервисами и FAQ.",
  path: "/guide",
});

export default function GuidePage() {
  return <GuideHubView />;
}
