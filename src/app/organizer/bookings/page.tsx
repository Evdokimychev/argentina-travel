import type { Metadata } from "next";
import OrganizerBookingsPageClient from "./OrganizerBookingsPageClient";

export const metadata: Metadata = { title: "Заявки — кабинет организатора" };

export default function OrganizerBookingsPage() {
  return <OrganizerBookingsPageClient />;
}
