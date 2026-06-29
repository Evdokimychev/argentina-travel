import type { Metadata } from "next";
import AboutPageView from "@/components/about/AboutPageView";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { getPlatformStatsFromMarketplace } from "@/lib/organizer-public";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "О проекте",
  description:
    "«Пора в Аргентину» — маркетплейс авторских туров по Аргентине. Миссия, ценности и как устроена платформа.",
  path: "/about",
});

export default async function AboutPage() {
  const tours = await fetchMarketplaceTours();
  const platformStats = getPlatformStatsFromMarketplace(tours);

  return <AboutPageView platformStats={platformStats} />;
}
