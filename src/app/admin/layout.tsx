import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/private-page-metadata";

export const metadata: Metadata = privatePageMetadata(
  "Администрирование",
  "Внутренний раздел платформы.",
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
