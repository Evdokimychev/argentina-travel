import type { Metadata } from "next";
import OrganizerSectionPageClient from "../OrganizerSectionPageClient";

export const metadata: Metadata = { title: "Отзывы" };

export default function Page() {
  return (
    <OrganizerSectionPageClient
      title="Отзывы"
      description="Отзывы участников ваших туров и рейтинг организатора."
    />
  );
}
