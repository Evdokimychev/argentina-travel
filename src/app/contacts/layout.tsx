import type { Metadata } from "next";
import ContactPageJsonLd from "@/components/seo/ContactPageJsonLd";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Свяжитесь с редакцией и менеджерами: форма обратной связи, WhatsApp, email и офис в Буэнос-Айресе.",
  alternates: { canonical: "/contacts" },
};

export default function ContactsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ContactPageJsonLd />
      {children}
    </>
  );
}
