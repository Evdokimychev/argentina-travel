import type { Metadata } from "next";
import OrganizerSettingsPageClient from "./OrganizerSettingsPageClient";

export const metadata: Metadata = {
  title: "Управление — кабинет организатора",
  description: "Настройки профиля автора тура.",
};

export default function OrganizerSettingsPage() {
  return <OrganizerSettingsPageClient />;
}
