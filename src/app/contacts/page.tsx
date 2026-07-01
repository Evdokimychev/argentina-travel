import type { Metadata } from "next";
import ContactsPageClient from "@/components/contacts/ContactsPageClient";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { resolveLocaleBreadcrumbItems } from "@/lib/locale-breadcrumbs";
import { getServicePageHeroImage } from "@/lib/media-resolver";
import { fetchSiteContact } from "@/lib/site-settings-server";
import { resolveStaticPageCopy } from "@/lib/static-page-copy";

const PAGE_TITLE_FALLBACK = "Контакты — связаться с командой";
const PAGE_DESCRIPTION_FALLBACK =
  "Напишите в WhatsApp, отправьте заявку на подбор тура или задайте вопрос по иммиграции и поездке в Аргентину.";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerI18nLocale();
  const title = resolveStaticPageCopy("contacts.meta.title", PAGE_TITLE_FALLBACK, locale);
  const description = resolveStaticPageCopy(
    "contacts.meta.description",
    PAGE_DESCRIPTION_FALLBACK,
    locale
  );

  return {
    ...buildPublicPageMetadata({
      title,
      description,
      path: "/contacts",
      image: getServicePageHeroImage("contacts"),
    }),
    alternates: buildHreflangAlternates("/contacts"),
  };
}

type PageProps = {
  searchParams: Promise<{
    tour?: string;
    product?: string;
    service?: string;
    topic?: string;
  }>;
};

export default async function ContactsPage({ searchParams }: PageProps) {
  const locale = await getServerI18nLocale();
  const contact = await fetchSiteContact(locale);
  const params = await searchParams;
  const pageTitle = resolveStaticPageCopy("contacts.meta.title", PAGE_TITLE_FALLBACK, locale);
  const pageDescription = resolveStaticPageCopy(
    "contacts.meta.description",
    PAGE_DESCRIPTION_FALLBACK,
    locale
  );
  const breadcrumbItems = resolveLocaleBreadcrumbItems(locale, [
    { labelKey: "nav.home", path: "/", fallback: "Главная" },
    { labelKey: "contacts.meta.title", path: "/contacts", fallback: PAGE_TITLE_FALLBACK },
  ]);

  return (
    <>
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <WebPageJsonLd name={pageTitle} description={pageDescription} path="/contacts" />
      <ContactsPageClient
        contactPageIntro={contact.contactPageIntro}
        whatsAppUrl={contact.whatsAppUrl}
        telegramUrl={contact.telegramUrl}
        instagramUrl={contact.instagramUrl}
        supportEmail={contact.supportEmail}
        formContext={{
          tourSlug: params.tour,
          productSlug: params.product,
          serviceSlug: params.service,
          topic: params.topic,
        }}
      />
    </>
  );
}
