import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Мои заказы — личный кабинет",
};

export default function ProfileOrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
