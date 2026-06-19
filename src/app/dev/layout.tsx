import type { Metadata } from "next";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/private-page-metadata";

export const metadata: Metadata = {
  robots: PRIVATE_PAGE_ROBOTS,
};

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return children;
}
