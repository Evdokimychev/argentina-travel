import type { Metadata } from "next";
import ImmigrationPageView from "@/components/immigration/ImmigrationPageView";

export const metadata: Metadata = {
  title: "Иммиграция и въезд — Пора в Аргентину",
  description:
    "Справочные материалы о визах, документах для въезда и видах ВНЖ в Аргентине — для туристов и тех, кто планирует длительное пребывание.",
};

export default function ImmigrationPage() {
  return <ImmigrationPageView />;
}
