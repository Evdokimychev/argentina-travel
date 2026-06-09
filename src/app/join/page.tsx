import type { Metadata } from "next";
import JoinPageView from "@/components/join/JoinPageView";

export const metadata: Metadata = {
  title: "Авторам путешествий",
  description:
    "Размещайте авторские туры по Аргентине на платформе «Пора в Аргентину». Бесплатное размещение, новый канал продаж и поддержка авторов.",
};

export default function JoinPage() {
  return <JoinPageView />;
}
