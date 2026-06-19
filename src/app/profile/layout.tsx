import type { Metadata } from "next";
import ProfileShell from "@/components/profile/ProfileShell";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/private-page-metadata";

export const metadata: Metadata = {
  title: {
    default: "Личный кабинет",
    template: "%s",
  },
  robots: PRIVATE_PAGE_ROBOTS,
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <ProfileShell>{children}</ProfileShell>;
}
