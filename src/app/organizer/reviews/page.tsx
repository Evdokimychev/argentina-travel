import type { Metadata } from "next";
import OrganizerReviewsPageClient from "./OrganizerReviewsPageClient";

export const metadata: Metadata = { title: "Отзывы — кабинет организатора" };

export default function OrganizerReviewsPage() {
  return <OrganizerReviewsPageClient />;
}
