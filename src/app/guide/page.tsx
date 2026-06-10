import type { Metadata } from "next";
import GuidePageView from "@/components/guide/GuidePageView";

export const metadata: Metadata = {
  title: "Путеводитель — Пора в Аргентину",
  description:
    "14 тем путеводителя: как добраться, где жить, регионы, культура, деньги и безопасность — с турами и сервисами.",
};

export default function GuidePage() {
  return <GuidePageView />;
}
