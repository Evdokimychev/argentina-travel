import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/private-page-metadata";

export const metadata: Metadata = privatePageMetadata(
  "Кабинет организатора",
  "Управление турами, заявками и сообщениями.",
);

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
