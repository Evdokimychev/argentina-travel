import type { Metadata } from "next";
import ProfileShell from "@/components/profile/ProfileShell";

export const metadata: Metadata = {
  title: {
    default: "Личный кабинет — Пора в Аргентину",
    template: "%s",
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <ProfileShell>{children}</ProfileShell>;
}
