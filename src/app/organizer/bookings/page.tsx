import type { Metadata } from "next";
import OrganizerSectionPageClient from "../OrganizerSectionPageClient";

export const metadata: Metadata = { title: "Заявки" };

export default function Page() {
  return (
    <OrganizerSectionPageClient
      title="Заявки"
      description="Входящие бронирования и запросы туристов появятся здесь."
    />
  );
}
