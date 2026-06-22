import type { Metadata } from "next";
import ContactsPageClient from "@/components/contacts/ContactsPageClient";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getServicePageHeroImage } from "@/lib/media-resolver";
import { fetchSiteContact } from "@/lib/site-settings-server";

const PAGE_TITLE = "Контакты — связаться с командой";
const PAGE_DESCRIPTION =
  "Напишите в WhatsApp, отправьте заявку на подбор тура или задайте вопрос по иммиграции и поездке в Аргентину.";

export const metadata: Metadata = {
  ...buildPublicPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/contacts",
    image: getServicePageHeroImage("contacts"),
  }),
  alternates: buildHreflangAlternates("/contacts"),
};

type PageProps = {
  searchParams: Promise<{
    tour?: string;
    product?: string;
    service?: string;
    topic?: string;
  }>;
};

export default async function ContactsPage({ searchParams }: PageProps) {
  const contact = await fetchSiteContact();
  const params = await searchParams;

  return (
    <ContactsPageClient
      contactPageIntro={contact.contactPageIntro}
      whatsAppUrl={contact.whatsAppUrl}
      supportEmail={contact.supportEmail}
      formContext={{
        tourSlug: params.tour,
        productSlug: params.product,
        serviceSlug: params.service,
        topic: params.topic,
      }}
    />
  );
}
