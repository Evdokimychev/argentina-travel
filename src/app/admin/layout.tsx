import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import { privatePageMetadata } from "@/lib/private-page-metadata";

export const metadata: Metadata = privatePageMetadata(
  "Администрирование",
  "Внутренний раздел платформы."
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
