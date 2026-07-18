import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/private-page-metadata";

export const metadata: Metadata = privatePageMetadata("Управление бронированием");

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
