import type { Metadata } from "next";
import AboutPageView from "@/components/about/AboutPageView";
import { getPlatformStatsFromRepository } from "@/lib/organizer-public";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "О нас — Пора в Аргентину",
  description:
    "Argentina Travel — маркетплейс авторских туров по Аргентине. Миссия, ценности и визуальный язык платформы.",
  path: "/about",
});

export default function AboutPage() {
  const platformStats = getPlatformStatsFromRepository();

  return <AboutPageView platformStats={platformStats} />;
}
