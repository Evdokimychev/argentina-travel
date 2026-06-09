import type { Metadata } from "next";
import OrganizerToursPageClient from "./OrganizerToursPageClient";

export const metadata: Metadata = {
  title: "Туры и экскурсии — кабинет организатора",
  description: "Управление турами и экскурсиями организатора.",
};

export default function OrganizerToursPage() {
  return <OrganizerToursPageClient />;
}
