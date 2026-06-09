import type { Metadata } from "next";
import OrganizerSectionPageClient from "../OrganizerSectionPageClient";

export const metadata: Metadata = { title: "Платежи" };

export default function Page() {
  return (
    <OrganizerSectionPageClient
      title="Платежи"
      description="История выплат, счета и финансовая отчётность."
    />
  );
}
