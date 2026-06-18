"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SkipToContentLink from "@/components/SkipToContentLink";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEmbed = pathname?.startsWith("/embed");

  if (isEmbed) {
    return <>{children}</>;
  }

  return (
    <>
      <SkipToContentLink />
      <Header />
      <div className="site-header-spacer shrink-0" aria-hidden="true" />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}
