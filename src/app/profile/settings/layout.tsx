import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Настройки — личный кабинет",
};

export default function ProfileSettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
