import type { Metadata } from "next";
import OrganizerDashboardPageClient from "./OrganizerDashboardPageClient";

export const metadata: Metadata = {
  title: "Кабинет организатора",
  description: "Управление турами, заявками и выплатами для авторов туров.",
};

export default function OrganizerDashboardPage() {
  return <OrganizerDashboardPageClient />;
}
