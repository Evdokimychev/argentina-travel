import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Контакты — Пора в Аргентину",
  description:
    "Свяжитесь с редакцией и менеджерами: форма обратной связи, WhatsApp, email и офис в Буэнос-Айресе.",
  alternates: { canonical: "/contacts" },
};

export default function ContactsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
