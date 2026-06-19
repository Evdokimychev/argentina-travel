import type { Metadata } from "next";
import AboutPageView from "@/components/about/AboutPageView";
import { getPlatformStatsFromRepository } from "@/lib/organizer-public";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "О проекте",
  description:
    "«Пора в Аргентину» — маркетплейс авторских туров по Аргентине. Миссия, ценности и как устроена платформа.",
  path: "/about",
});

export default function AboutPage() {
  const platformStats = getPlatformStatsFromRepository();

  return <AboutPageView platformStats={platformStats} />;
}
