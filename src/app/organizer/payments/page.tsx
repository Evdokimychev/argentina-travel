import type { Metadata } from "next";
import OrganizerPaymentsPageClient from "./OrganizerPaymentsPageClient";

export const metadata: Metadata = { title: "Платежи — кабинет организатора" };

export default function OrganizerPaymentsPage() {
  return <OrganizerPaymentsPageClient />;
}
