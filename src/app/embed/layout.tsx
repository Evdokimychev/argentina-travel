import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/private-page-metadata";

export const metadata: Metadata = privatePageMetadata("Встраиваемый модуль");

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
