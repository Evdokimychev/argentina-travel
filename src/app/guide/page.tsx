import type { Metadata } from "next";
import GuideHubView from "@/components/guide/GuideHubView";

export const metadata: Metadata = {
  title: "Путеводитель по Аргентине — Пора в Аргентину",
  description:
    "14 тем для планирования поездки: перелёты, регионы, деньги, культура и безопасность — с турами, сервисами и FAQ.",
};

export default function GuidePage() {
  return <GuideHubView />;
}
