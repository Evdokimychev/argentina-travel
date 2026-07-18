import type { Metadata } from "next";
import OrganizerIntegrationsPageClient from "./OrganizerIntegrationsPageClient";

export const metadata: Metadata = {
  title: "Интеграции — кабинет организатора",
  description: "Подключение внешних систем, виджета туров и статистика использования.",
};

export default function OrganizerIntegrationsPage() {
  return <OrganizerIntegrationsPageClient />;
}
