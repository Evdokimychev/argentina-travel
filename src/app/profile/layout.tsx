import type { Metadata } from "next";
import ProfileShell from "@/components/profile/ProfileShell";

export const metadata: Metadata = {
  title: "Личный кабинет — Пора в Аргентину",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <ProfileShell>{children}</ProfileShell>;
}
