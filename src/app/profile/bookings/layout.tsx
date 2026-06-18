import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Мои бронирования — личный кабинет",
  description: "Заявки, подтверждённые поездки и лист ожидания туриста.",
};

export default function ProfileBookingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
