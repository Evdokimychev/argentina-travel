"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SkipToContentLink from "@/components/SkipToContentLink";

export type SiteLegalFooterInfo = {
  legalLine: string | null;
  supportEmail: string | null;
};

export default function SiteChrome({
  children,
  siteLegal,
}: {
  children: React.ReactNode;
  siteLegal?: SiteLegalFooterInfo;
}) {
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
      <main id="main-content" className="relative z-0 flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer siteLegal={siteLegal} />
    </>
  );
}
