import type { Metadata } from "next";
import OrganizerIntegrationsPageClient from "./OrganizerIntegrationsPageClient";

export const metadata: Metadata = {
  title: "Интеграции — кабинет организатора",
  description: "API-ключи, партнёрские вебхуки, виджет и статистика использования.",
};

export default function OrganizerIntegrationsPage() {
  return <OrganizerIntegrationsPageClient />;
}
