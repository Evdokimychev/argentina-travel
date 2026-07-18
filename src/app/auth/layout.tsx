import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/private-page-metadata";

export const metadata: Metadata = privatePageMetadata("Вход и восстановление доступа");

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
