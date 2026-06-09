import type { Metadata } from "next";
import { Unbounded } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import "./globals.css";

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-unbounded",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ArgentinaTravel — Путешествия по Аргентине",
    template: "%s | ArgentinaTravel",
  },
  description:
    "Авторские туры по Аргентине: Патагония, Буэнос-Айрес, Мендоса, Игуасу. Русскоязычные гиды, незабываемые впечатления.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={unbounded.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
