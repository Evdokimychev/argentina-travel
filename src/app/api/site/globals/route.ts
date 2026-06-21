import { NextResponse } from "next/server";
import { fetchSiteBranding, fetchSiteContact, fetchSiteLegal } from "@/lib/site-settings-server";
import { formatSiteLegalLine } from "@/lib/site-legal-display";

/** Public read-only site globals for footer and client widgets. */
export async function GET() {
  const [legal, contact, branding] = await Promise.all([
    fetchSiteLegal(),
    fetchSiteContact(),
    fetchSiteBranding(),
  ]);

  const social: Array<{ label: string; href: string }> = [];
  if (contact.telegramUrl?.trim()) {
    social.push({ label: "Telegram", href: contact.telegramUrl.trim() });
  }
  if (contact.whatsAppUrl?.trim()) {
    social.push({ label: "WhatsApp", href: contact.whatsAppUrl.trim() });
  }
  if (contact.instagramUrl?.trim()) {
    social.push({ label: "Instagram", href: contact.instagramUrl.trim() });
  }

  const supportEmail =
    contact.supportEmail?.trim() || legal.supportEmail?.trim() || null;

  return NextResponse.json(
    {
      siteName: branding.siteName,
      tagline: branding.tagline,
      legalLine: formatSiteLegalLine(legal),
      supportEmail,
      social,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
