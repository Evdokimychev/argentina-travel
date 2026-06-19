import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Сообщения — личный кабинет",
  description: "Переписка с организаторами по турам и бронированиям.",
};

export default function ProfileMessagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
