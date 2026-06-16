"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
