import type { Metadata } from "next";
import OrganizerSectionPageClient from "../OrganizerSectionPageClient";

export const metadata: Metadata = { title: "Сообщения" };

export default function Page() {
  return (
    <OrganizerSectionPageClient
      title="Сообщения"
      description="Переписка с туристами и уведомления от платформы."
    />
  );
}
