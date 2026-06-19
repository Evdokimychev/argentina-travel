import type { Metadata } from "next";
import OrganizerAnalyticsPageClient from "./OrganizerAnalyticsPageClient";

export const metadata: Metadata = {
  title: "Аналитика — кабинет организатора",
  description: "Базовая и расширенная аналитика продаж туров, выручки и клиентов.",
};

export default function OrganizerAnalyticsPage() {
  return <OrganizerAnalyticsPageClient />;
}
