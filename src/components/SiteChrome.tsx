"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SkipToContentLink from "@/components/SkipToContentLink";
import type { SiteFooterInfo } from "@/lib/site-footer-info";

export type { SiteFooterInfo };

/** @deprecated Use SiteFooterInfo */
export type SiteLegalFooterInfo = SiteFooterInfo;

export default function SiteChrome({
  children,
  siteFooter,
  /** @deprecated Pass siteFooter instead */
  siteLegal,
}: {
  children: React.ReactNode;
  siteFooter?: SiteFooterInfo;
  siteLegal?: SiteFooterInfo;
}) {
  const pathname = usePathname();
  const isEmbed = pathname?.startsWith("/embed");
  const isMaintenance = pathname === "/maintenance";
  const footerInfo = siteFooter ?? siteLegal;

  if (isEmbed || isMaintenance) {
    return <>{children}</>;
  }

  return (
    <>
      <SkipToContentLink />
      <Header />
      <div className="site-header-spacer shrink-0" aria-hidden="true" />
      <main id="main-content" className="relative z-0 flex-1 bg-surface-elevated" tabIndex={-1}>
        {children}
      </main>
      <Footer siteFooter={footerInfo} />
    </>
  );
}
